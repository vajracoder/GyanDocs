import json, re

def slugify(s):
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")

subjects_raw = [
    dict(name="Operating Systems", code="OS",
         description="Process management, synchronization, deadlocks, memory and file systems.",
         icon="OS", accent="#2F5FFF"),
    dict(name="Database Management Systems", code="DBMS",
         description="ER modeling, SQL, normalization, transactions and indexing.",
         icon="DB", accent="#16A34A"),
    dict(name="Computer Organization & Architecture", code="COA",
         description="CPU design, instruction sets, memory hierarchy and pipelining.",
         icon="CO", accent="#F5A623"),
    dict(name="Compiler Design", code="CD",
         description="Lexical analysis, parsing, syntax-directed translation and code generation.",
         icon="CD", accent="#8B5CF6"),
    dict(name="Python Programming", code="PY",
         description="Core syntax, functions, data structures, OOP and file handling in Python.",
         icon="PY", accent="#2F5FFF"),
    dict(name="Computer Networks", code="CN",
         description="OSI/TCP-IP model, routing, transport protocols and application layer services.",
         icon="CN", accent="#16A34A"),
]

subjects = []
for i, s in enumerate(subjects_raw, start=1):
    slug = slugify(s["name"])
    subjects.append(dict(
        id=f"sub-{i:02d}", slug=slug, name=s["name"], code=s["code"],
        description=s["description"], icon=s["icon"], accent=s["accent"],
    ))

subj_by_name = {s["name"]: s for s in subjects}

units_def = {
    "Operating Systems": [
        ("Introduction & Process Management", "Processes, PCB, process states and CPU scheduling."),
        ("Process Synchronization", "Critical section problem, semaphores and classical sync problems."),
        ("Deadlocks", "Deadlock conditions, prevention, avoidance, detection and recovery."),
        ("Memory Management", "Paging, segmentation, virtual memory and page replacement."),
        ("File Systems & I/O", "File allocation methods, directory structures and disk scheduling."),
    ],
    "Database Management Systems": [
        ("Introduction to DBMS & ER Model", "Database concepts, ER diagrams and relational mapping."),
        ("Relational Model & SQL", "Relational algebra, DDL, DML and query writing."),
        ("Normalization", "Functional dependencies and normal forms (1NF-BCNF)."),
        ("Transactions & Concurrency Control", "ACID properties, schedules, locking and deadlock handling."),
        ("Indexing & File Organization", "B/B+ trees, hashing and storage structures."),
    ],
    "Computer Organization & Architecture": [
        ("Basic Computer Organization", "Von Neumann architecture, registers and the instruction cycle."),
        ("CPU Architecture & Instruction Sets", "Addressing modes, RISC vs CISC and control unit design."),
        ("Memory Organization", "Cache memory, mapping techniques and memory hierarchy."),
        ("I/O Organization", "I/O interfacing, interrupts and DMA."),
        ("Pipelining & Parallel Processing", "Instruction pipelining, hazards and parallel architectures."),
    ],
    "Compiler Design": [
        ("Introduction & Lexical Analysis", "Phases of a compiler, tokens and finite automata."),
        ("Syntax Analysis (Parsing)", "Top-down and bottom-up parsing techniques."),
        ("Syntax-Directed Translation", "Attribute grammars and intermediate code generation."),
        ("Code Optimization", "Local and global optimization techniques."),
        ("Code Generation", "Target code generation and register allocation."),
    ],
    "Python Programming": [
        ("Basics & Control Structures", "Variables, data types, operators, loops and conditionals."),
        ("Functions & Modules", "Function definitions, scope, recursion and Python modules."),
        ("Data Structures (List, Tuple, Dict)", "Built-in structures, trees and common operations."),
        ("OOP in Python", "Classes, objects, inheritance and polymorphism."),
        ("File Handling & Exception Handling", "Reading/writing files and try-except error handling."),
    ],
    "Computer Networks": [
        ("Introduction & OSI/TCP-IP Model", "Network models, layers and their responsibilities."),
        ("Data Link Layer", "Framing, error detection and MAC protocols."),
        ("Network Layer", "IP addressing, subnetting and routing algorithms."),
        ("Transport Layer", "TCP, UDP, flow control and congestion control."),
        ("Application Layer", "DNS, HTTP, FTP and email protocols."),
    ],
}

units = []
unit_lookup = {}
uid = 1
for subj_name, unit_list in units_def.items():
    subj = subj_by_name[subj_name]
    for idx, (uname, udesc) in enumerate(unit_list, start=1):
        uslug = f"unit-{idx}"
        u = dict(id=f"unit-{uid:03d}", subjectSlug=subj["slug"], subjectName=subj["name"],
                  slug=uslug, unitNumber=idx, name=uname, description=udesc)
        units.append(u)
        unit_lookup[(subj_name, idx)] = u
        uid += 1

topics_def = {
    ("Operating Systems", 1): ["Introduction to Operating Systems", "Process States & PCB", "CPU Scheduling Algorithms", "Multithreading"],
    ("Operating Systems", 2): ["Critical Section Problem", "Semaphores", "Mutex Locks", "Producer-Consumer Problem"],
    ("Operating Systems", 3): ["Deadlock", "Banker's Algorithm", "Deadlock Detection", "Deadlock Recovery", "Resource Allocation Graph"],
    ("Operating Systems", 4): ["Paging", "Segmentation", "Virtual Memory", "Page Replacement Algorithms"],
    ("Operating Systems", 5): ["File Allocation Methods", "Disk Scheduling Algorithms", "I/O Systems"],
    ("Database Management Systems", 1): ["ER Model & Diagrams", "Database Architecture", "Keys & Constraints"],
    ("Database Management Systems", 2): ["Relational Algebra", "SQL Queries & Joins", "DDL and DML Commands"],
    ("Database Management Systems", 3): ["Functional Dependencies", "Normal Forms (1NF to BCNF)", "Decomposition"],
    ("Database Management Systems", 4): ["ACID Properties", "Concurrency Control", "Deadlock in Transactions"],
    ("Database Management Systems", 5): ["B+ Tree Indexing", "Hashing Techniques", "File Organization"],
    ("Computer Organization & Architecture", 1): ["Von Neumann Architecture", "Register Organization", "Instruction Cycle"],
    ("Computer Organization & Architecture", 2): ["Addressing Modes", "RISC vs CISC", "Control Unit Design"],
    ("Computer Organization & Architecture", 3): ["Cache Memory", "Cache Mapping Techniques", "Memory Hierarchy"],
    ("Computer Organization & Architecture", 4): ["Interrupt Handling", "DMA", "I/O Interfacing"],
    ("Computer Organization & Architecture", 5): ["Instruction Pipelining", "Pipeline Hazards", "Parallel Processing"],
    ("Compiler Design", 1): ["Phases of a Compiler", "Lexical Analysis & Tokens", "Finite Automata"],
    ("Compiler Design", 2): ["Top-Down Parsing", "Bottom-Up Parsing", "LL(1) and LR Parsers"],
    ("Compiler Design", 3): ["Syntax Directed Definitions", "Intermediate Code Generation"],
    ("Compiler Design", 4): ["Local Optimization", "Global Optimization", "Data Flow Analysis"],
    ("Compiler Design", 5): ["Target Code Generation", "Register Allocation"],
    ("Python Programming", 1): ["Variables & Data Types", "Loops & Conditionals", "Operators in Python"],
    ("Python Programming", 2): ["Function Arguments", "Recursion", "Python Modules & Packages"],
    ("Python Programming", 3): ["List Operations", "Tuples & Sets", "Dictionaries", "Binary Tree Traversal"],
    ("Python Programming", 4): ["Classes & Objects", "Inheritance", "Polymorphism"],
    ("Python Programming", 5): ["File Read/Write Operations", "Exception Handling", "Custom Exceptions"],
    ("Computer Networks", 1): ["OSI Model Layers", "TCP/IP Model", "Network Topologies"],
    ("Computer Networks", 2): ["Framing Techniques", "Error Detection & Correction", "MAC Protocols"],
    ("Computer Networks", 3): ["IP Addressing & Subnetting", "Routing Algorithms", "Network Layer Protocols"],
    ("Computer Networks", 4): ["TCP vs UDP", "Flow Control", "Congestion Control"],
    ("Computer Networks", 5): ["DNS", "HTTP & HTTPS", "Email Protocols"],
}

topics = []
topic_lookup = {}
tid = 1
for (subj_name, unum), tnames in topics_def.items():
    unit = unit_lookup[(subj_name, unum)]
    subj = subj_by_name[subj_name]
    for tname in tnames:
        tslug = slugify(tname)
        t = dict(id=f"topic-{tid:03d}", subjectSlug=subj["slug"], subjectName=subj_name,
                  unitSlug=unit["slug"], unitName=unit["name"], unitNumber=unum,
                  slug=tslug, name=tname)
        topics.append(t)
        topic_lookup[(subj_name, unum, tname)] = t
        tid += 1

questions_raw = [
    ("Operating Systems", 1, "Introduction to Operating Systems", "What is an Operating System? Explain its main functions with a neat diagram.", 5, 2023, 3),
    ("Operating Systems", 1, "Process States & PCB", "Draw and explain the process state transition diagram with the role of PCB.", 7, 2022, 4),
    ("Operating Systems", 1, "CPU Scheduling Algorithms", "Explain FCFS, SJF and Round Robin CPU scheduling algorithms with a suitable example.", 10, 2024, 6),
    ("Operating Systems", 1, "CPU Scheduling Algorithms", "Calculate average waiting time and turnaround time for the given process set using Round Robin (quantum = 4).", 7, 2023, 5),
    ("Operating Systems", 1, "CPU Scheduling Algorithms", "Differentiate between preemptive and non-preemptive scheduling with examples.", 5, 2021, 3),
    ("Operating Systems", 1, "Multithreading", "What is multithreading? Explain the benefits of multithreaded programming over single-threaded processes.", 5, 2022, 2),
    ("Operating Systems", 2, "Critical Section Problem", "What is the Critical Section Problem? State the three requirements a solution must satisfy.", 5, 2023, 4),
    ("Operating Systems", 2, "Semaphores", "Explain binary and counting semaphores. Solve the Producer-Consumer problem using semaphores.", 10, 2024, 5),
    ("Operating Systems", 2, "Mutex Locks", "Differentiate between a mutex lock and a semaphore.", 3, 2021, 2),
    ("Operating Systems", 2, "Producer-Consumer Problem", "Explain the Producer-Consumer problem and its solution using a bounded buffer.", 7, 2022, 3),
    ("Operating Systems", 3, "Deadlock", "What is a deadlock? Explain the four necessary conditions for deadlock to occur.", 7, 2024, 6),
    ("Operating Systems", 3, "Deadlock", "Explain deadlock prevention and deadlock avoidance strategies with examples.", 10, 2023, 5),
    ("Operating Systems", 3, "Banker's Algorithm", "State and explain the Banker's Algorithm for deadlock avoidance with a numerical example.", 13, 2024, 6),
    ("Operating Systems", 3, "Banker's Algorithm", "Given the allocation, max and available matrices, find the safe sequence using Banker's Algorithm.", 10, 2022, 5),
    ("Operating Systems", 3, "Deadlock Detection", "Explain the deadlock detection algorithm for a system with a single instance of each resource type.", 7, 2023, 3),
    ("Operating Systems", 3, "Deadlock Recovery", "What are the different methods to recover from deadlock? Explain process termination and resource preemption.", 5, 2021, 2),
    ("Operating Systems", 3, "Resource Allocation Graph", "Explain Resource Allocation Graph (RAG). How is it used to detect deadlock in a system?", 7, 2022, 4),
    ("Operating Systems", 4, "Paging", "Explain paging with the help of a diagram. How does it solve the problem of external fragmentation?", 7, 2023, 4),
    ("Operating Systems", 4, "Segmentation", "Differentiate between paging and segmentation.", 5, 2022, 3),
    ("Operating Systems", 4, "Virtual Memory", "What is virtual memory? Explain demand paging and the concept of page fault.", 7, 2024, 5),
    ("Operating Systems", 4, "Page Replacement Algorithms", "Explain FIFO, LRU and Optimal page replacement algorithms with an example reference string.", 10, 2023, 5),
    ("Operating Systems", 5, "File Allocation Methods", "Explain contiguous, linked and indexed file allocation methods with their advantages and disadvantages.", 7, 2022, 3),
    ("Operating Systems", 5, "Disk Scheduling Algorithms", "Explain SCAN and C-SCAN disk scheduling algorithms with an example.", 7, 2023, 4),
    ("Operating Systems", 5, "I/O Systems", "Explain the structure of the I/O system and the role of device drivers.", 5, 2021, 2),
    ("Database Management Systems", 1, "ER Model & Diagrams", "Design an ER diagram for a University Management System with at least 5 entities.", 10, 2023, 5),
    ("Database Management Systems", 1, "Database Architecture", "Explain the three-schema architecture of a DBMS with a diagram.", 5, 2022, 3),
    ("Database Management Systems", 1, "Keys & Constraints", "Differentiate between primary key, candidate key, foreign key and super key with examples.", 5, 2024, 4),
    ("Database Management Systems", 2, "Relational Algebra", "Explain the fundamental operations of relational algebra with examples.", 7, 2023, 3),
    ("Database Management Systems", 2, "SQL Queries & Joins", "Write SQL queries to demonstrate INNER JOIN, LEFT JOIN and RIGHT JOIN using suitable tables.", 10, 2024, 6),
    ("Database Management Systems", 2, "DDL and DML Commands", "Differentiate between DDL, DML, DCL and TCL commands with examples of each.", 5, 2022, 3),
    ("Database Management Systems", 3, "Functional Dependencies", "What is a functional dependency? Explain with an example how it is used to identify normal forms.", 5, 2023, 3),
    ("Database Management Systems", 3, "Normal Forms (1NF to BCNF)", "Explain 1NF, 2NF, 3NF and BCNF with suitable examples for each.", 10, 2024, 6),
    ("Database Management Systems", 3, "Decomposition", "What is lossless decomposition? Explain with an example.", 7, 2021, 2),
    ("Database Management Systems", 4, "ACID Properties", "Explain the ACID properties of a transaction with real-world examples.", 5, 2023, 5),
    ("Database Management Systems", 4, "Concurrency Control", "Explain two-phase locking (2PL) protocol for concurrency control.", 7, 2022, 4),
    ("Database Management Systems", 4, "Deadlock in Transactions", "Explain deadlock in the context of database transactions and methods to handle it.", 7, 2024, 3),
    ("Database Management Systems", 5, "B+ Tree Indexing", "Explain the structure of a B+ tree index and how search operations are performed on it.", 10, 2023, 4),
    ("Database Management Systems", 5, "Hashing Techniques", "Differentiate between static hashing and dynamic hashing.", 5, 2022, 2),
    ("Computer Organization & Architecture", 1, "Von Neumann Architecture", "Explain the Von Neumann architecture with a block diagram.", 5, 2023, 4),
    ("Computer Organization & Architecture", 1, "Register Organization", "Explain the general register organization of a CPU.", 5, 2022, 2),
    ("Computer Organization & Architecture", 1, "Instruction Cycle", "Explain the fetch-decode-execute cycle with a flowchart.", 7, 2024, 3),
    ("Computer Organization & Architecture", 2, "Addressing Modes", "Explain different addressing modes with suitable examples for each.", 7, 2023, 5),
    ("Computer Organization & Architecture", 2, "RISC vs CISC", "Differentiate between RISC and CISC architectures.", 5, 2022, 4),
    ("Computer Organization & Architecture", 3, "Cache Memory", "What is cache memory? Explain its role in improving system performance.", 5, 2023, 4),
    ("Computer Organization & Architecture", 3, "Cache Mapping Techniques", "Explain direct, associative and set-associative cache mapping techniques.", 10, 2024, 5),
    ("Computer Organization & Architecture", 4, "Interrupt Handling", "Explain the interrupt handling mechanism in a computer system.", 7, 2022, 3),
    ("Computer Organization & Architecture", 4, "DMA", "What is DMA? Explain how it improves data transfer efficiency compared to programmed I/O.", 7, 2023, 3),
    ("Computer Organization & Architecture", 5, "Instruction Pipelining", "Explain the concept of instruction pipelining with a suitable diagram.", 10, 2024, 5),
    ("Computer Organization & Architecture", 5, "Pipeline Hazards", "Explain structural, data and control hazards in pipelining with examples.", 7, 2023, 4),
    ("Compiler Design", 1, "Phases of a Compiler", "Explain the different phases of a compiler with a neat diagram.", 10, 2023, 6),
    ("Compiler Design", 1, "Lexical Analysis & Tokens", "What is lexical analysis? Explain the role of tokens, patterns and lexemes.", 5, 2022, 4),
    ("Compiler Design", 1, "Finite Automata", "Convert the given regular expression into a minimal DFA.", 7, 2024, 3),
    ("Compiler Design", 2, "Top-Down Parsing", "Explain recursive descent parsing with a suitable example.", 7, 2023, 3),
    ("Compiler Design", 2, "LL(1) and LR Parsers", "Differentiate between LL(1) and LR parsers.", 7, 2022, 4),
    ("Compiler Design", 3, "Syntax Directed Definitions", "Explain syntax directed definitions (SDD) with a suitable example.", 5, 2023, 2),
    ("Compiler Design", 3, "Intermediate Code Generation", "Explain three-address code with an example of translating an expression into it.", 7, 2024, 4),
    ("Compiler Design", 4, "Local Optimization", "Explain local optimization techniques used by a compiler with examples.", 5, 2022, 2),
    ("Compiler Design", 4, "Global Optimization", "Explain loop optimization and common subexpression elimination.", 7, 2023, 3),
    ("Compiler Design", 5, "Target Code Generation", "Explain the issues in the design of a code generator.", 7, 2022, 3),
    ("Compiler Design", 5, "Register Allocation", "Explain register allocation and assignment strategies used during code generation.", 5, 2021, 2),
    ("Python Programming", 1, "Variables & Data Types", "Explain Python's built-in data types with suitable examples.", 5, 2023, 4),
    ("Python Programming", 1, "Loops & Conditionals", "Write a Python program to check whether a given number is prime using a for loop.", 5, 2024, 5),
    ("Python Programming", 1, "Operators in Python", "Explain arithmetic, relational and logical operators in Python with examples.", 3, 2022, 2),
    ("Python Programming", 2, "Function Arguments", "Explain positional, keyword, default and variable-length arguments in Python functions.", 5, 2023, 4),
    ("Python Programming", 2, "Recursion", "Write a Python program to compute the factorial of a number using recursion.", 5, 2024, 5),
    ("Python Programming", 2, "Python Modules & Packages", "Differentiate between a module and a package in Python with examples.", 3, 2022, 2),
    ("Python Programming", 3, "List Operations", "Write a Python program to implement common list operations: append, insert, remove and sort.", 5, 2023, 4),
    ("Python Programming", 3, "Tuples & Sets", "Differentiate between lists, tuples and sets in Python with examples.", 5, 2022, 3),
    ("Python Programming", 3, "Dictionaries", "Write a Python program to count the frequency of words in a sentence using a dictionary.", 7, 2024, 4),
    ("Python Programming", 3, "Binary Tree Traversal", "Write a Python program to implement a binary tree and perform inorder, preorder and postorder traversal.", 10, 2024, 5),
    ("Python Programming", 3, "Binary Tree Traversal", "Explain how a binary search tree (BST) is implemented in Python with insertion and search operations.", 10, 2023, 4),
    ("Python Programming", 4, "Classes & Objects", "Explain classes and objects in Python with a suitable example program.", 5, 2023, 4),
    ("Python Programming", 4, "Inheritance", "Write a Python program to demonstrate single and multiple inheritance.", 7, 2024, 3),
    ("Python Programming", 4, "Polymorphism", "Explain polymorphism in Python with an example of method overriding.", 5, 2022, 2),
    ("Python Programming", 5, "File Read/Write Operations", "Write a Python program to read a text file and count the number of words in it.", 5, 2023, 3),
    ("Python Programming", 5, "Exception Handling", "Explain try, except, else and finally blocks in Python with an example.", 5, 2024, 4),
    ("Computer Networks", 1, "OSI Model Layers", "Explain all seven layers of the OSI model with their functions.", 10, 2023, 6),
    ("Computer Networks", 1, "TCP/IP Model", "Differentiate between the OSI model and the TCP/IP model.", 5, 2024, 5),
    ("Computer Networks", 1, "Network Topologies", "Explain star, bus, ring and mesh network topologies with diagrams.", 5, 2022, 3),
    ("Computer Networks", 2, "Framing Techniques", "Explain byte stuffing and bit stuffing framing techniques with examples.", 7, 2023, 3),
    ("Computer Networks", 2, "Error Detection & Correction", "Explain CRC (Cyclic Redundancy Check) with a suitable example.", 7, 2024, 4),
    ("Computer Networks", 3, "IP Addressing & Subnetting", "Explain subnetting with an example of dividing a Class C network into 4 subnets.", 10, 2024, 6),
    ("Computer Networks", 3, "Routing Algorithms", "Differentiate between distance vector and link state routing algorithms.", 7, 2023, 4),
    ("Computer Networks", 4, "TCP vs UDP", "Differentiate between TCP and UDP with their use cases.", 5, 2023, 5),
    ("Computer Networks", 4, "Congestion Control", "Explain congestion control techniques used in TCP, including slow start.", 7, 2024, 4),
    ("Computer Networks", 5, "DNS", "Explain the working of DNS (Domain Name System) with a diagram.", 5, 2023, 3),
    ("Computer Networks", 5, "HTTP & HTTPS", "Differentiate between HTTP and HTTPS. Explain the role of SSL/TLS.", 5, 2022, 3),
]

def priority_for(freq):
    if freq >= 5: return "High"
    if freq >= 3: return "Medium"
    return "Low"

questions = []
for i, (subj_name, unum, tname, qtext, marks, year, freq) in enumerate(questions_raw, start=1):
    unit = unit_lookup[(subj_name, unum)]
    subj = subj_by_name[subj_name]
    topic = topic_lookup[(subj_name, unum, tname)]
    questions.append(dict(
        id=f"q-{i:04d}", subjectSlug=subj["slug"], subjectName=subj_name,
        unitSlug=unit["slug"], unitName=unit["name"], unitNumber=unum,
        topicSlug=topic["slug"], topicName=tname, question=qtext,
        marks=marks, year=year, frequency=freq, priority=priority_for(freq),
        pdfUrl="/sample.pdf",
    ))

from collections import Counter
q_by_subject = Counter(q["subjectSlug"] for q in questions)
q_by_unit = Counter((q["subjectSlug"], q["unitSlug"]) for q in questions)
q_by_topic = Counter((q["subjectSlug"], q["unitSlug"], q["topicSlug"]) for q in questions)
u_by_subject = Counter(u["subjectSlug"] for u in units)
t_by_unit = Counter((t["subjectSlug"], t["unitSlug"]) for t in topics)

for s in subjects:
    s["unitsCount"] = u_by_subject[s["slug"]]
    s["questionsCount"] = q_by_subject[s["slug"]]
for u in units:
    key = (u["subjectSlug"], u["slug"])
    u["topicsCount"] = t_by_unit[key]
    u["questionsCount"] = q_by_unit[key]
for t in topics:
    key = (t["subjectSlug"], t["unitSlug"], t["slug"])
    t["questionsCount"] = q_by_topic[key]

out_dir = "/home/claude/examvault/src/data"
with open(f"{out_dir}/subjects.json", "w") as f: json.dump(subjects, f, indent=2)
with open(f"{out_dir}/units.json", "w") as f: json.dump(units, f, indent=2)
with open(f"{out_dir}/topics.json", "w") as f: json.dump(topics, f, indent=2)
with open(f"{out_dir}/questions.json", "w") as f: json.dump(questions, f, indent=2)

print("subjects:", len(subjects))
print("units:", len(units))
print("topics:", len(topics))
print("questions:", len(questions))
