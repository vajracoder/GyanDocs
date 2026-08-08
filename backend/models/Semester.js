import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
      max: 8,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Semester = mongoose.model("Semester", semesterSchema);

export default Semester;