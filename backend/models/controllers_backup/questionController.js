console.log("=== LOADED QUESTION CONTROLLER ===");
console.log(__filename);

module.exports = {
  getRevisionQuestions: (req, res) => {
    res.send("Revision");
  },

  getQuestionsByTopic: (req, res) => {
    res.send("Topic");
  },

  getQuestionById: (req, res) => {
    res.send("ID");
  },
};