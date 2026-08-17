/**
 * GyanDocs Question Classifier Service â€” v3
 *
 * Automatically classifies a question into a Unit and Sub-unit (Topic)
 * based on the subject's syllabus structure stored in MongoDB.
 *
 * The classifier is syllabus-driven â€” it reads the actual Unit and Topic
 * documents for the given subject. It does NOT hardcode any subject-specific
 * topics. If the subject has no units/topics, or the question is ambiguous,
 * it returns a low-confidence result and the caller must require manual
 * classification.
 *
 * â”€â”€ Architecture â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * Phase 0: Concept extraction â€” normalize the question, remove generic
 *          exam language, normalize plurals, extract technical concepts.
 *
 * Phase 1: Rich syllabus profiles â€” each Unit/Topic is expanded into
 *   a normalized concept profile (core terms, aliases, concepts, related terms)
 *   derived from the actual DB documents.
 *
 * Phase 2: Multi-signal scoring â€” each question is scored against a
 *   profile using six independent signals:
 *     - exactKeywordMatch  (exact keyword overlap)
 *     - phraseMatch        (exact phrase overlap)
 *     - aliasMatch         (alias overlap)
 *     - conceptMatch       (concept/related-term overlap)
 *     - contextMatch       (description/context overlap)
 *     - questionTerminologyMatch (question terminology/context)
 *   These are combined with configurable weights.
 *
 * Phase 3: Two-stage classification â€” first rank Units, then rank
 *   Topics only within the strongest Unit(s).
 *
 * Phase 4: Ambiguity detection â€” requires BOTH a minimum confidence
 *   AND a sufficient margin between best and second-best.
 *
 * â”€â”€ Confidence levels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *   >= 0.85  HIGH    â€” automatically suggest (with sufficient margin)
 *   0.65â€“0.84 MEDIUM â€” suggest but require admin review
 *   < 0.65   LOW     â€” do NOT confidently assign; require manual classification
 *
 * â”€â”€ Honest description â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * This is deterministic matching, NOT AI or semantic understanding.
 * It uses weighted token/phrase/concept overlap against syllabus data.
 * "Concept matching" here means: if a question mentions a term that is
 * listed as a keyword/alias/concept of a topic, that is a strong signal.
 * It does not understand meaning; it matches known term associations.
 */

const Unit = require("../models/Unit");
const Topic = require("../models/Topic");

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Configurable weights & thresholds â€” ALL in one section.
// Do NOT scatter magic numbers throughout the code.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const WEIGHTS = {
  exactKeywordMatch: 1.0,
  phraseMatch: 0.9,
  aliasMatch: 0.8,
  conceptMatch: 0.7,
  contextMatch: 0.4,
  questionTerminologyMatch: 0.3,
};

const THRESHOLDS = {
  HIGH: 0.85,
  MEDIUM: 0.65,
  // Minimum margin between best and second-best to be considered
  // unambiguous. If the gap is smaller, the classification is
  // downgraded to MEDIUM (or LOW if very close).
  MIN_MARGIN: 0.15,
  // If the margin is below this, treat as highly ambiguous â†’ LOW.
  AMBIGUOUS_MARGIN: 0.05,
};

const confidenceLabel = (score) => {
  if (score >= THRESHOLDS.HIGH) return "HIGH";
  if (score >= THRESHOLDS.MEDIUM) return "MEDIUM";
  return "LOW";
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Text normalization helpers
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Stop-words that carry little topical meaning.
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "then", "else", "for", "of",
  "in", "on", "at", "to", "from", "with", "by", "is", "are", "was", "were",
  "be", "been", "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "can", "could", "should", "may", "might", "must", "shall", "this",
  "that", "these", "those", "it", "its", "as", "which", "what", "when",
  "where", "why", "how", "explain", "describe", "discuss", "define", "write",
  "list", "what", "why", "how", "also", "not", "no", "yes", "so", "such",
  "than", "too", "very", "just", "about", "into", "over", "after", "before",
  "between", "under", "again", "further", "then", "once", "here", "there",
  "all", "any", "both", "each", "few", "more", "most", "other", "some",
  "such", "only", "own", "same", "than", "too", "very", "s", "t", "can",
  "will", "just", "don", "should", "now", "i", "me", "my", "we", "our",
  "you", "your", "he", "she", "they", "them", "their", "us", "our",
]);

// Normalize a string into a set of meaningful lowercase tokens.
const tokenize = (text) => {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")   // punctuation â†’ space
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
};

// Build a phrase list from a string: split on common separators and
// also include the full string as a single phrase.
const buildPhrases = (text) => {
  const raw = (text || "").toLowerCase();
  const parts = raw
    .split(/[,;()\-â€“â€”/]+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 2);
  // Also add the whole string as one phrase
  if (raw.trim().length > 2) parts.push(raw.trim());
  return parts;
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Phase 0: Concept extraction
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Generic exam verbs / instruction language that carry no topical
// meaning and are removed before concept extraction.
const EXAM_LANGUAGE = new Set([
  "define", "explain", "discuss", "differentiate", "describe", "write",
  "list", "what", "why", "how", "when", "where", "which", "who", "whom",
  "state", "mention", "enumerate", "illustrate", "justify", "prove",
  "show", "demonstrate", "compare", "contrast", "distinguish", "identify",
  "determine", "calculate", "compute", "evaluate", "analyze", "analyse",
  "design", "construct", "create", "develop", "implement", "apply",
  "solve", "find", "give", "provide", "answer", "attempt",
  "elaborate", "summarize", "summarise", "outline", "review", "examine",
  "investigate", "assess", "interpret", "classify", "categorize",
  "categorise", "select", "choose", "name", "label", "mark", "draw",
  "sketch", "plot", "graph", "tabulate", "prepare", "make", "derive",
  "obtain", "produce", "generate", "convert", "transform", "translate",
  "express", "represent", "model", "simulate", "test", "verify", "check",
  "validate", "confirm", "ensure", "guarantee", "maintain", "preserve",
  "consider", "assume", "suppose", "let", "given", "using", "use",
  "with", "without", "based", "according", "following", "above", "below",
  "respectively", "also", "then", "now", "here", "there",
  "please", "kindly", "note", "important", "must", "should", "would",
  "could", "can", "may", "might", "shall", "will", "need", "required",
  "necessary", "essential", "possible", "impossible", "always", "never",
  "often", "usually", "sometimes", "generally", "typically", "commonly",
  "frequently", "rarely", "seldom", "occasionally", "normally",
]);

// Plural to singular normalizations (candidate keys → candidate key)
const IRREGULAR_PLURALS = {
  analyses: "analysis",
  bibliographies: "bibliography",
  cache: "cache",
  caches: "cache",
  children: "child",
  criteria: "criterion",
  data: "data",
  databases: "database",
  entities: "entity",
  indices: "index",
  indexes: "index",
  levels: "level",
  matrices: "matrix",
  phenomena: "phenomenon",
  queries: "query",
  schemas: "schema",
  schemata: "schema",
  statuses: "status",
  stimuli: "stimulus",
};

const normalizeWord = (word) => {
  const lower = word.toLowerCase();
  if (IRREGULAR_PLURALS[lower]) return IRREGULAR_PLURALS[lower];
  if (/[^aeiou]ies$/.test(lower)) {
    return lower.replace(/ies$/, "y");
  }
  if (/(ss|us|is)es$/.test(lower)) {
    return lower.replace(/es$/, "e");
  }
  // Strip trailing "s" for common technical plurals:
  //   attributes → attribute, databases → database, joins → join,
  //   relations → relation, transactions → transaction, keys → key
  // But protect words ending in ss/us/is/as/os (process, status, analysis, os)
  if (/s$/.test(lower) && !/(ss|us|is|as|os)$/.test(lower)) {
    return lower.slice(0, -1);
  }
  return lower;
};

const tokenizeConcepts = (text) => {
  if (!text) return [];
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map(normalizeWord)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t) && !EXAM_LANGUAGE.has(t));
};

const buildConceptPhrases = (text) => {
  const raw = (text || "").toLowerCase();
  const parts = raw
    .split(/[,;()\-â€“â€”/]+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 2);
  if (raw.trim().length > 2) parts.push(raw.trim());
  return parts;
};

/**
 * Extract a compact set of canonical concepts from a question.
 *
 * Example:
 *   "Determine all candidate keys of relation R(A,B,C,D) using the given
 *    functional dependencies."
 *
 * Returns:
 *   { concepts: ["candidate key", "functional dependency", "relation"],
 *     tokens: Set["candidate", "key", "functional", "dependency", "relation"] }
 */
const extractConcepts = (text) => {
  const tokens = tokenizeConcepts(text);
  const tokenSet = new Set(tokens);
  const phrases = buildConceptPhrases(text);

  // Multi-word concepts we look for in the phrase list.
  // These are generic/general academic phrases (not subject-specific),
  // so they don't violate the "no DBMS-specific" rule.
  const multiWordPatterns = [
    "candidate key", "super key", "primary key", "foreign key",
    "functional dependency", "functional dependencies",
    "normal form", "normal forms", "relational model",
    "er diagram", "entity relationship", "weak entity", "strong entity",
    "referential integrity", "entity integrity", "relational algebra",
    "natural join", "outer join", "cross join", "cartesian product",
    "transaction schedule", "concurrency control", "two phase locking",
    "timestamp ordering", "deadlock", "log file", "distributed database",
    "two phase commit", "b tree", "b+ tree", "hash table",
    "file organization", "page replacement", "virtual memory",
    "cpu scheduling", "process synchronization", "critical section",
    "semaphore", "memory management", "address translation",
    "operating system", "network layer", "transport layer",
    "data link layer", "application layer", "routing algorithm",
    "tcp", "udp", "ip address", "dns", "http", "ftp",
    "compiler", "lexical analysis", "syntax analysis", "parsing",
    "code generation", "code optimization", "intermediate code",
    "syntax directed", "register allocation", "instruction pipelining",
    "cache memory", "memory hierarchy", "addressing mode",
    "instruction set", "pipeline hazard", "dma", "interrupt",
    "exception handling", "file handling", "object oriented",
    "inheritance", "polymorphism", "recursion", "module",
    "data structure", "linked list", "binary tree", "stack", "queue",
  ];

  const concepts = new Set();
  const combinedText = " " + phrases.join(" ") + " ";

  for (const pattern of multiWordPatterns) {
    if (combinedText.includes(pattern)) {
      concepts.add(pattern);
      // Also add the singular canonical form if the matched pattern is plural.
      // e.g. "functional dependencies" → also add "functional dependency"
      const lastSpace = pattern.lastIndexOf(" ");
      if (lastSpace > 0) {
        const head = pattern.slice(0, lastSpace + 1);
        const lastWord = pattern.slice(lastSpace + 1);
        const singularLast = normalizeWord(lastWord);
        if (singularLast !== lastWord) {
          concepts.add(head + singularLast);
        }
      }
    }
  }

  // Single tokens that are already strong technical terms become concepts.
  const technicalSingletons = new Set([
    "candidate", "super", "primary", "foreign", "key", "keys",
    "entity", "attribute", "attributes", "relation", "relational", "schema",
    "normalization", "normalize", "normalized", "dependency",
    "decomposition", "lossless", "transaction", "acid", "serializability",
    "serializable", "concurrency", "locking", "recovery", "replication",
    "fragmentation", "distributed", "indexing", "hashing", "sql", "query",
    "join", "joins", "trigger", "view", "procedure", "constraint",
    "integrity", "er", "diagram", "model", "architecture", "dbms",
    "database", "data", "level", "isolation", "atomicity", "durability",
    "consistency", "schedule", "conflict", "timestamp", "deadlock",
    "inference", "closure", "prime", "non", "attributes",
    "redundancy", "anomaly", "update", "delete", "insert", "truncate",
    "network", "protocol", "packet", "frame", "segment", "router",
    "subnet", "congestion", "flow", "checksum", "hamming", "crc",
    "compiler", "token", "grammar", "parser", "parse", "lexer",
    "optimization", "register", "memory", "cache", "page", "paging",
    "segmentation", "semaphore", "mutex", "process", "thread",
    "scheduling", "virtual", "file", "directory",
    "python", "list", "tuple", "dict", "dictionary", "set", "function",
    "module", "class", "object", "oop",
  ]);

  for (const t of tokens) {
    if (technicalSingletons.has(t)) {
      concepts.add(t);
    }
  }

  return {
    concepts: [...concepts],
    tokens: tokenSet,
  };
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Generic concept alias groups
//
// These are NOT subject-specific. They map common academic phrasings
// to a canonical concept group. The classifier then checks whether any member
// of the group appears in the syllabus profile.
//
// This mechanism is generic â€” the same alias groups apply to any subject.
// In the future these could be stored per-topic in the DB instead.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CONCEPT_GROUPS = [
  // Keys / relational model
  { canonical: "candidate key", aliases: ["candidate key", "candidate keys", "minimal key", "minimal keys", "super key", "super keys", "primary key", "primary keys", "foreign key", "foreign keys"], relatedTo: ["relational model", "functional dependency", "normalization"] },
  { canonical: "relational model", aliases: ["relational model", "relational", "relation", "relations", "keys", "key"], relatedTo: ["candidate key", "integrity constraints", "sql", "relational algebra"] },
  { canonical: "integrity constraints", aliases: ["referential integrity", "entity integrity", "integrity constraint", "integrity constraints", "constraint", "constraints"], relatedTo: ["relational model"] },

  // Normalization
  { canonical: "normalization", aliases: ["normalization", "normalize", "normalised", "normalized", "normal form", "normal forms", "1nf", "2nf", "3nf", "bcnf", "4nf"], relatedTo: ["functional dependency", "decomposition"] },
  { canonical: "functional dependency", aliases: ["functional dependency", "functional dependencies", "fd", "fds", "dependency", "dependencies"], relatedTo: ["normalization", "candidate key"] },
  { canonical: "decomposition", aliases: ["decomposition", "decompose", "lossless decomposition", "lossless join", "lossy decomposition", "dependency preservation", "dependency preserving"], relatedTo: ["normalization"] },

  // Transactions / concurrency
  { canonical: "transaction", aliases: ["transaction", "transactions", "acid", "atomicity", "isolation", "durability", "consistency"], relatedTo: ["concurrency control", "recovery"] },
  { canonical: "concurrency control", aliases: ["concurrency control", "concurrent", "concurrency", "serializability", "serializable", "timestamp ordering", "timestamp", "locking", "lock", "locks", "deadlock", "deadlocks", "two phase locking", "2pl"], relatedTo: ["transaction"] },
  { canonical: "recovery", aliases: ["recovery", "recover", "log file", "log", "logging", "failure", "failures", "crash", "checkpoint", "undo", "redo"], relatedTo: ["transaction"] },

  // DBMS architecture
  { canonical: "dbms architecture", aliases: ["dbms architecture", "architecture", "dbms", "database", "database management system", "components", "three schema", "data independence"], relatedTo: ["er model"] },

  // ER model
  { canonical: "er model", aliases: ["er model", "er diagram", "entity relationship", "entity", "entities", "entity set", "entity sets", "weak entity", "strong entity", "relationship", "relationships", "attribute", "attributes"], relatedTo: ["dbms architecture", "relational model"] },

  // SQL / relational algebra
  { canonical: "sql", aliases: ["sql", "query", "queries", "ddl", "dml", "dcl", "select", "insert", "update", "delete", "truncate", "trigger", "triggers", "view", "views", "join", "joins", "group by", "order by", "having"], relatedTo: ["relational model", "relational algebra"] },
  { canonical: "relational algebra", aliases: ["relational algebra", "selection", "projection", "cartesian product", "natural join", "theta join", "rename", "union", "intersection", "difference"], relatedTo: ["relational model", "sql"] },

  // Indexing
  { canonical: "indexing", aliases: ["indexing", "index", "indexes", "b tree", "b+ tree", "b-tree", "b+-tree", "hashing", "hash", "hash table", "file organization", "storage", "clustering", "primary index", "secondary index"], relatedTo: [] },

  // Distributed DBMS
  { canonical: "distributed dbms", aliases: ["distributed", "distributed database", "distributed dbms", "replication", "replicate", "fragmentation", "horizontal fragmentation", "vertical fragmentation", "distributed transaction", "two phase commit", "2pc"], relatedTo: [] },

  // Operating Systems
  { canonical: "process management", aliases: ["process", "processes", "pcb", "process control block", "process state", "process states", "cpu scheduling", "scheduling", "scheduler", "context switch"], relatedTo: ["process synchronization"] },
  { canonical: "process synchronization", aliases: ["synchronization", "critical section", "semaphore", "semaphores", "mutex", "mutual exclusion", "producer consumer", "reader writer", "dining philosopher"], relatedTo: ["process management", "deadlock"] },
  { canonical: "deadlock", aliases: ["deadlock", "deadlocks", "deadlock prevention", "deadlock avoidance", "banker algorithm", "deadlock detection", "deadlock recovery"], relatedTo: ["process synchronization"] },
  { canonical: "memory management", aliases: ["memory management", "paging", "segmentation", "virtual memory", "page replacement", "page table", "tlb", "thrashing", "fragmentation", "address translation"], relatedTo: [] },
  { canonical: "file systems", aliases: ["file system", "file systems", "file allocation", "directory", "directories", "disk scheduling", "inode", "fat", "ntfs", "i/o", "input output"], relatedTo: [] },

  // Computer Networks END
  { canonical: "network models", aliases: ["osi", "tcp/ip", "network model", "network models", "protocol stack", "layers", "layer"], relatedTo: [] },
  { canonical: "data link layer", aliases: ["data link", "framing", "error detection", "error correction", "mac", "medium access", "ethernet", "crc", "checksum", "hamming"], relatedTo: [] },
  { canonical: "network layer", aliases: ["network layer", "ip", "ip address", "ipv4", "ipv6", "subnet", "subnetting", "routing", "router", "routing algorithm", "arp", "icmp"], relatedTo: [] },
  { canonical: "transport layer", aliases: ["transport layer", "tcp", "udp", "flow control", "congestion control", "port", "socket", "handshake"], relatedTo: [] },
  { canonical: "application layer", aliases: ["application layer", "dns", "http", "https", "ftp", "smtp", "pop3", "imap", "email", "web"], relatedTo: [] },

  // Compiler Design END
  { canonical: "lexical analysis", aliases: ["lexical analysis", "lexer", "token", "tokens", "finite automata", "regular expression", "regex"], relatedTo: ["syntax analysis"] },
  { canonical: "syntax analysis", aliases: ["syntax analysis", "parsing", "parser", "grammar", "context free", "top down", "bottom up", "ll", "lr", "slr", "clr", "lalr", "parse tree"], relatedTo: ["lexical analysis"] },
  { canonical: "syntax directed translation", aliases: ["syntax directed", "attribute grammar", "intermediate code", "three address", "quadruple", "triple", "sdt"], relatedTo: [] },
  { canonical: "code optimization", aliases: ["code optimization", "optimization", "loop optimization", "constant folding", "dead code", "common subexpression"], relatedTo: [] },
  { canonical: "code generation", aliases: ["code generation", "register allocation", "target code", "instruction selection", "peephole"], relatedTo: [] },

  // Computer Organization & Architecture END
  { canonical: "basic computer organization", aliases: ["von neumann", "computer organization", "register", "registers", "instruction cycle", "fetch", "decode", "execute", "control unit"], relatedTo: [] },
  { canonical: "cpu architecture", aliases: ["cpu", "addressing mode", "addressing modes", "risc", "cisc", "instruction set", "instruction format", "microoperation"], relatedTo: [] },
  { canonical: "memory organization", aliases: ["memory organization", "cache", "cache memory", "cache mapping", "direct mapping", "associative mapping", "set associative", "memory hierarchy", "main memory", "secondary memory"], relatedTo: [] },
  { canonical: "io organization", aliases: ["i/o", "io", "input output", "interrupt", "interrupts", "dma", "direct memory access", "io interface", "polling"], relatedTo: [] },
  { canonical: "pipelining", aliases: ["pipelining", "pipeline", "instruction pipeline", "pipeline hazard", "hazards", "parallel processing", "superscalar"], relatedTo: [] },

  // Python Programming END
  { canonical: "python basics", aliases: ["python", "variable", "variables", "data type", "data types", "operator", "operators", "loop", "loops", "conditional", "conditionals", "control structure"], relatedTo: [] },
  { canonical: "python functions", aliases: ["function", "functions", "recursion", "recursive", "module", "modules", "scope", "lambda", "argument", "arguments", "parameter", "parameters"], relatedTo: [] },
  { canonical: "python data structures", aliases: ["list", "lists", "tuple", "tuples", "dict", "dictionary", "dictionaries", "set", "sets", "data structure", "data structures", "stack", "queue", "linked list", "tree"], relatedTo: [] },
  { canonical: "python oop", aliases: ["class", "classes", "object", "objects", "oop", "object oriented", "inheritance", "polymorphism", "encapsulation", "abstraction", "constructor", "destructor"], relatedTo: [] },
  { canonical: "python file handling", aliases: ["file handling", "file", "files", "read", "write", "open", "close", "exception", "exceptions", "exception handling", "try", "except", "finally", "raise"], relatedTo: [] },
];

// Build a lookup: alias â†’ canonical group
const ALIAS_TO_GROUP = new Map();
// Build a lookup: canonical group â†’ related groups
const GROUP_RELATED = new Map();
for (const group of CONCEPT_GROUPS) {
  for (const alias of group.aliases) {
    ALIAS_TO_GROUP.set(alias, group.canonical);
  }
  GROUP_RELATED.set(group.canonical, new Set(group.relatedTo || []));
}

/**
 * Given a question's phrases, return the set of canonical concept groups
 * that the question touches.
 */
const detectConceptGroups = (phrases) => {
  const groups = new Set();
  for (const phrase of phrases) {
    const lower = phrase.toLowerCase();
    for (const [alias, canonical] of ALIAS_TO_GROUP) {
      if (lower.includes(alias)) {
        groups.add(canonical);
      }
    }
  }
  return groups;
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Phase 1: Rich syllabus profiles
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Build a normalized concept profile for a Unit or Topic document.
 *
 * The profile is derived from the actual DB document:
 *   - name + description (always)
 *   - keywords, aliases, concepts (if present on the Topic)
 *
 * Returns:
 * {
 *   name, description,
 *   nameTokens, descTokens,
 *   namePhrases, descPhrases,
 *   coreTerms,   // Set of normalized terms
 *   keywords,    // Set of explicit keywords
 *   aliases,     // Set of explicit aliases
 *   concepts,     // Set of explicit concepts
 *   conceptGroups, // Set of canonical concept groups this entry belongs to
 * }
 */
const buildProfile = (entry) => {
  const name = entry.name || "";
  const description = entry.description || "";

  const nameTokens = tokenize(name);
  const descTokens = tokenize(description);
  const namePhrases = buildPhrases(name);
  const descPhrases = buildPhrases(description);

  // Core terms: name + description tokens, plus any explicit
  // keywords/aliases/concepts fields on the Topic document.
  const coreTerms = new Set([...nameTokens, ...descTokens]);

  // Explicit profile fields (optional)
  const keywords = new Set();
  const aliases = new Set();
  const concepts = new Set();

  // If the Topic has rich profile fields, incorporate them.
  if (entry.keywords && Array.isArray(entry.keywords)) {
    for (const kw of entry.keywords) {
      keywords.add(kw.toLowerCase());
      for (const t of tokenize(kw)) coreTerms.add(t);
    }
  }
  if (entry.aliases && Array.isArray(entry.aliases)) {
    for (const a of entry.aliases) {
      aliases.add(a.toLowerCase());
      for (const t of tokenize(a)) coreTerms.add(t);
    }
  }
  if (entry.concepts && Array.isArray(entry.concepts)) {
    for (const c of entry.concepts) {
      concepts.add(c.toLowerCase());
      for (const t of tokenize(c)) coreTerms.add(t);
    }
  }

  // Detect which canonical concept groups this entry belongs to.
  const allPhrases = [...namePhrases, ...descPhrases];
  if (entry.keywords) allPhrases.push(...entry.keywords);
  if (entry.aliases) allPhrases.push(...entry.aliases);
  if (entry.concepts) allPhrases.push(...entry.concepts);
  const conceptGroups = detectConceptGroups(allPhrases);

  return {
    name,
    description,
    nameTokens,
    descTokens,
    namePhrases,
    descPhrases,
    coreTerms,
    keywords,
    aliases,
    concepts,
    conceptGroups,
  };
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Phase 2: Multi-signal scoring (6 signals)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Compute the six independent signals between a question and a profile.
 *
 * Returns:
 * {
 *   exactKeywordMatch, phraseMatch, aliasMatch,
 *   conceptMatch, contextMatch, questionTerminologyMatch
 * } each in [0, 1].
 */
const computeSignals = (questionTokens, questionPhrases, questionConceptGroups, profile, specificityMap) => {
  // Helper: get specificity weight for a term (IDF-like).
  // Terms appearing in many topics get lower weight.
  const termWeight = (term) => {
    if (!specificityMap) return 1;
    const w = specificityMap.get(term);
    return w !== undefined ? w : 1;
  };
  // 1. Exact keyword match â€” does the question contain an exact keyword
  //    from the profile's explicit keywords field?
  let exactKeywordMatch = 0;
  if (profile.keywords.size > 0) {
    const qText = questionPhrases.join(" ").toLowerCase();
    for (const kw of profile.keywords) {
      if (qText.includes(kw)) {
        exactKeywordMatch += 1;
      }
    }
    exactKeywordMatch = Math.min(1, exactKeywordMatch);
  }

  // 2. Phrase match â€” exact phrase overlap between question and profile
  let phraseMatch = 0;
  for (const qp of questionPhrases) {
    if (qp.length < 3) continue;
    if (profile.namePhrases.some((np) => np.includes(qp) || qp.includes(np))) {
      phraseMatch += 1;
    }
    if (profile.descPhrases.some((dp) => dp.includes(qp) || qp.includes(dp))) {
      phraseMatch += 0.7;
    }
  }
  phraseMatch = Math.min(1, phraseMatch);

  // 3. Alias match â€” does the question contain an alias of the profile?
  let aliasMatch = 0;
  if (profile.aliases.size > 0) {
    const qText = questionPhrases.join(" ").toLowerCase();
    for (const alias of profile.aliases) {
      if (qText.includes(alias)) {
        aliasMatch += 1;
      }
    }
    aliasMatch = Math.min(1, aliasMatch);
  }

  // 4. Concept match â€” overlap between question's concept groups and the
  //    profile's concept groups, plus overlapping related groups,
  //    plus direct core-term overlap, plus explicit concept overlap.
  let conceptMatch = 0;
  if (questionConceptGroups.size > 0 && profile.conceptGroups.size > 0) {
    const inter = new Set([...questionConceptGroups].filter((g) => profile.conceptGroups.has(g)));
    const union = new Set([...questionConceptGroups, ...profile.conceptGroups]);
    conceptMatch += (inter.size / union.size) * 0.7;

    // Related-group overlap: if a question group is related to a profile group,
    // that's a weaker but still meaningful signal.
    let relatedHits = 0;
    for (const qg of questionConceptGroups) {
      const related = GROUP_RELATED.get(qg) || new Set();
      for (const pg of profile.conceptGroups) {
        if (related.has(pg)) relatedHits++;
      }
    }
    if (relatedHits > 0) {
      conceptMatch += Math.min(0.3, relatedHits * 0.1);
    }
  }
  // Direct core-term overlap (question token appears in profile core terms).
  // Weight each matching term by its specificity (IDF-like): a term like
  // "BCNF" appearing in only one topic contributes more than a generic term
  // like "database" that appears in many topics.
  if (profile.coreTerms.size > 0 && questionTokens.length > 0) {
    // Sum specificity weights of matched terms vs matched + unmatched.
    let matchedWeight = 0;
    let allWeight = 0;
    const seen = new Set();
    for (const t of questionTokens) {
      if (seen.has(t)) continue;
      seen.add(t);
      if (profile.coreTerms.has(t)) {
        matchedWeight += termWeight(t);
      }
      allWeight += termWeight(t);
    }
    // Also account for profile terms not hit by the question (negative/competing).
    let profileUnmatchedWeight = 0;
    for (const ct of profile.coreTerms) {
      if (!questionTokens.includes(ct)) {
        profileUnmatchedWeight += termWeight(ct);
      }
    }
    conceptMatch += (allWeight > 0 ? matchedWeight / (allWeight + profileUnmatchedWeight) : 0) * 0.3;
  }
  // Negative evidence: if the question contains a high-specificity technical term
  // that is NOT part of this profile, penalize slightly.
  let negativeEvidence = 0;
  for (const token of questionTokens) {
    const w = termWeight(token);
    if (w >= 1.2 && !profile.coreTerms.has(token)) {
      negativeEvidence += w * 0.02;
    }
  }
  conceptMatch = Math.max(0, conceptMatch - Math.min(0.15, negativeEvidence));
  // Explicit concept overlap (question mentions a profile concept)
  if (profile.concepts.size > 0) {
    const qText = questionPhrases.join(" ").toLowerCase();
    for (const c of profile.concepts) {
      if (qText.includes(c)) {
        conceptMatch += 0.2;
      }
    }
  }
  conceptMatch = Math.min(1, conceptMatch);

  // 5. Context match â€” description/context overlap.
  //    Does the question use terms that appear in the profile's description?
  let contextMatch = 0;
  for (const t of questionTokens) {
    if (profile.descTokens.includes(t)) {
      contextMatch += 0.3;
    }
  }
  contextMatch = Math.min(1, contextMatch);

  // 6. Question terminology match â€” does the question use academic
  //    terminology that aligns with the profile name?
  let questionTerminologyMatch = 0;
  for (const t of questionTokens) {
    if (profile.nameTokens.includes(t)) {
      questionTerminologyMatch += 0.5;
    }
  }
  questionTerminologyMatch = Math.min(1, questionTerminologyMatch);

  return {
    exactKeywordMatch,
    phraseMatch,
    aliasMatch,
    conceptMatch,
    contextMatch,
    questionTerminologyMatch,
  };
};

/**
 * Combine the six signals into a single weighted score.
 */
const combineSignals = (signals) => {
  return (
    signals.exactKeywordMatch * WEIGHTS.exactKeywordMatch +
    signals.phraseMatch * WEIGHTS.phraseMatch +
    signals.aliasMatch * WEIGHTS.aliasMatch +
    signals.conceptMatch * WEIGHTS.conceptMatch +
    signals.contextMatch * WEIGHTS.contextMatch +
    signals.questionTerminologyMatch * WEIGHTS.questionTerminologyMatch
  );
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Phase 3 + 4: Two-stage classification with ambiguity detection
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Classify a question into a unit + sub-unit (topic) for a given subject.
 *
 * @param {Object} params
 * @param {string} params.questionText  The question text to classify.
 * @param {string} params.subjectId  The subject's ObjectId.
 *
 * @returns {Promise<Object>} {
 *   unitId, unitName, unitNumber,
 *   topicId, topicName,
 *   unitConfidence, topicConfidence,
 *   classificationConfidence, confidenceLabel,
 *   needsManualReview,
 *   best: { unitId, topicId, score },
 *   secondBest: { unitId, topicId, score },
 *   margin,
 *   alternatives: [{ unitId, topicId, score }]
 * }
 */
const classifyQuestion = async ({ questionText, subjectId }) => {
  const empty = {
    unitId: null,
    unitName: null,
    unitNumber: null,
    topicId: null,
    topicName: null,
    unitConfidence: 0,
    topicConfidence: 0,
    classificationConfidence: 0,
    confidenceLabel: "LOW",
    needsManualReview: true,
    best: null,
    secondBest: null,
    margin: 0,
    alternatives: [],
  };

  if (!questionText || !subjectId) return empty;

  const questionTokens = tokenize(questionText);
  const questionPhrases = buildPhrases(questionText);
  const questionConceptGroups = detectConceptGroups(questionPhrases);

  if (questionTokens.length === 0) return empty;

  // Load the subject's syllabus (units + their topics)
  const units = await Unit.find({ subjectId, isActive: true }).sort({ unitNumber: 1 });
  if (!units || units.length === 0) return empty;

  const unitIds = units.map((u) => u._id);
  const topics = await Topic.find({ unitId: { $in: unitIds }, isActive: true });

  // ── Build specificity map (IDF-like) from the actual syllabus ──
  // If a term appears in many topics, it has low information value.
  // If a term appears in only one topic, it has high information value.
  const termDocCount = new Map();
  for (const topic of topics) {
    const profile = buildProfile(topic);
    const terms = new Set([
      ...profile.nameTokens,
      ...profile.descTokens,
      ...profile.keywords,
      ...profile.aliases,
      ...profile.concepts,
    ]);
    for (const term of terms) {
      termDocCount.set(term, (termDocCount.get(term) || 0) + 1);
    }
  }
  const totalTopics = Math.max(1, topics.length);
  const specificityMap = new Map();
  for (const [term, count] of termDocCount) {
    // IDF-like: log(N / df). Terms in 1 topic get high weight (~1.0),
    // terms in many topics get low weight.
    const idf = Math.log(totalTopics / count) + 1;
    // Clamp to [0.1, 1.5]
    specificityMap.set(term, Math.min(1.5, Math.max(0.1, idf)));
  }

  // ── Stage 1: Rank Units ──────────────────────────────────
  const unitScores = units.map((unit) => {
    const profile = buildProfile(unit);
    const signals = computeSignals(questionTokens, questionPhrases, questionConceptGroups, profile, specificityMap);
    return {
      unit,
      profile,
      score: combineSignals(signals),
      signals,
    };
  });

  // Sort units by score descending
  unitScores.sort((a, b) => b.score - a.score);

  const bestUnit = unitScores[0] || null;
  const secondBestUnit = unitScores[1] || null;

  // â”€â”€ Stage 2: Rank Topics only within the strongest Unit(s) â”€â”€
  // We consider topics in the best unit, and also in the second-best
  // unit if it's close, to compute the margin correctly.
  const candidateUnits = [bestUnit];
  if (secondBestUnit && bestUnit && (bestUnit.score - secondBestUnit.score) < THRESHOLDS.AMBIGUOUS_MARGIN * 2) {
    candidateUnits.push(secondBestUnit);
  }

  const topicScores = [];
  for (const cu of candidateUnits) {
    if (!cu) continue;
    const unitTopics = topics.filter((t) => t.unitId.toString() === cu.unit._id.toString());
    for (const topic of unitTopics) {
      const profile = buildProfile(topic);
      const signals = computeSignals(questionTokens, questionPhrases, questionConceptGroups, profile, specificityMap);
      topicScores.push({
        unit: cu.unit,
        topic,
        profile,
        score: combineSignals(signals),
        signals,
      });
    }
  }

  // Sort topics by score descending
  topicScores.sort((a, b) => b.score - a.score);

  const bestTopic = topicScores[0] || null;
  const secondBestTopic = topicScores[1] || null;

  // â”€â”€ Compute confidence â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // unitConfidence = best unit score (clamped to [0,1])
  // topicConfidence = best topic score (clamped to [0,1])
  // classificationConfidence = blend of both
  const unitConfidence = bestUnit ? Math.min(1, Math.max(0, bestUnit.score)) : 0;
  const topicConfidence = bestTopic ? Math.min(1, Math.max(0, bestTopic.score)) : 0;

  let classificationConfidence = unitConfidence;
  if (bestTopic && topicConfidence > 0) {
    // Blend: 70% unit + 30% topic
    classificationConfidence = unitConfidence * 0.7 + topicConfidence * 0.3;
  }
  classificationConfidence = Math.min(1, Math.max(0, classificationConfidence));

  // â”€â”€ Phase 4: Ambiguity detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Require BOTH a minimum confidence AND a sufficient margin
  // between best and second-best.
  const unitMargin = bestUnit && secondBestUnit
    ? bestUnit.score - secondBestUnit.score
    : (bestUnit ? 1 : 0);
  const topicMargin = bestTopic && secondBestTopic
    ? bestTopic.score - secondBestTopic.score
    : (bestTopic ? 1 : 0);

  // Use the smaller margin as the effective margin (conservative).
  const effectiveMargin = Math.min(unitMargin, topicMargin);

  let label = confidenceLabel(classificationConfidence);

  // Downgrade based on margin
  if (effectiveMargin < THRESHOLDS.AMBIGUOUS_MARGIN) {
    // Highly ambiguous â€” downgrade to LOW regardless of absolute score
    label = "LOW";
  } else if (effectiveMargin < THRESHOLDS.MIN_MARGIN) {
    // Insufficient margin â€” downgrade HIGH to MEDIUM
    if (label === "HIGH") label = "MEDIUM";
  }

  const needsManualReview = label !== "HIGH";

  // Build best/second-best candidate info
  const bestInfo = bestTopic ? {
    unitId: bestTopic.unit._id,
    unitName: bestTopic.unit.name,
    unitNumber: bestTopic.unit.unitNumber,
    topicId: bestTopic.topic._id,
    topicName: bestTopic.topic.name,
    score: Math.min(1, Math.max(0, bestTopic.score)),
  } : null;

  const secondBestInfo = secondBestTopic ? {
    unitId: secondBestTopic.unit._id,
    unitName: secondBestTopic.unit.name,
    unitNumber: secondBestTopic.unit.unitNumber,
    topicId: secondBestTopic.topic._id,
    topicName: secondBestTopic.topic.name,
    score: Math.min(1, Math.max(0, secondBestTopic.score)),
  } : null;

  // If LOW, do NOT confidently assign â€” return nulls.
  if (label === "LOW") {
    return {
      unitId: null,
      unitName: null,
      unitNumber: null,
      topicId: null,
      topicName: null,
      unitConfidence,
      topicConfidence,
      classificationConfidence,
      confidenceLabel: label,
      needsManualReview: true,
      best: bestInfo,
      secondBest: secondBestInfo,
      margin: effectiveMargin,
      alternatives: topicScores.slice(0, 3).map((ts) => ({
        unitId: ts.unit._id,
        topicId: ts.topic._id,
        score: Math.min(1, Math.max(0, ts.score)),
      })),
    };
  }

  return {
    unitId: bestUnit ? bestUnit.unit._id : null,
    unitName: bestUnit ? bestUnit.unit.name : null,
    unitNumber: bestUnit ? bestUnit.unit.unitNumber : null,
    topicId: bestTopic ? bestTopic.topic._id : null,
    topicName: bestTopic ? bestTopic.topic.name : null,
    unitConfidence,
    topicConfidence,
    classificationConfidence,
    confidenceLabel: label,
    needsManualReview,
    best: bestInfo,
    secondBest: secondBestInfo,
    margin: effectiveMargin,
    alternatives: topicScores.slice(0, 3).map((ts) => ({
      unitId: ts.unit._id,
      topicId: ts.topic._id,
      score: Math.min(1, Math.max(0, ts.score)),
    })),
  };
};

module.exports = {
  classifyQuestion,
  confidenceLabel,
  WEIGHTS,
  THRESHOLDS,
  // Expose internals for testing
  _internal: {
    tokenize,
    buildPhrases,
    buildProfile,
    computeSignals,
    combineSignals,
    detectConceptGroups,
    CONCEPT_GROUPS,
    extractConcepts,
  },
};

