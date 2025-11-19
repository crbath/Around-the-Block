import mongoose from "mongoose";

const TimeEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId },
  time: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

const BarSchema = new mongoose.Schema({
  barId: { type: String, required: true },
  barName: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  timeEntries: [TimeEntrySchema]
});

const Bar = mongoose.model("Bar", BarSchema, "bars");

export default Bar;
