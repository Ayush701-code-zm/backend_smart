const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "query_assigned",
        "solution_provided",
        "solution_approved",
        "solution_rejected",
        "new_query_submitted",
        "knowledge_base_updated",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    message: {
      type: String,
      required: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },

    // Related objects
    relatedQuery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Query",
    },

    relatedKnowledgeBase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KnowledgeBase",
    },

    // Notification state
    read: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
    },

    actionRequired: {
      type: Boolean,
      default: false,
    },

    // Priority
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    // Auto-expire notifications
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ actionRequired: 1, read: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
