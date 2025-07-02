const mongoose = require("mongoose");

const knowledgeBaseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
      minlength: [10, "Content must be at least 10 characters"],
    },
    summary: {
      type: String,
      trim: true,
      maxlength: [300, "Summary cannot exceed 300 characters"],
    },
    organization: {
      type: String,
      required: [true, "Organization is required"],
      enum: [
        "KHUSHII",
        "JWP",
        "ANIMAL CARE",
        "GREEN EARTH",
        "EDUCATION FIRST",
        "ALL",
      ],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    workflow: {
      sourceQuery: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Query",
      },
      solutionProvider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      originalSolution: {
        type: String,
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      approvalDate: {
        type: Date,
      },
      adminEdits: {
        type: String,
        maxlength: [1000, "Admin edit notes cannot exceed 1000 characters"],
      },
      publishedAt: {
        type: Date,
        default: Date.now,
      },
    },
    searchKeywords: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    alternativeTitles: [String],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived", "under_review"],
      default: "published",
    },
    metrics: {
      views: { type: Number, default: 0 },
      helpful: { type: Number, default: 0 },
      notHelpful: { type: Number, default: 0 },
      searches: { type: Number, default: 0 },
      lastAccessed: Date,
    },
    ratings: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          maxlength: [200, "Comment cannot exceed 200 characters"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    featured: {
      type: Boolean,
      default: false,
    },

    version: {
      type: Number,
      default: 1,
    },

    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

knowledgeBaseSchema.index({ organization: 1, category: 1 });
knowledgeBaseSchema.index({ status: 1, createdAt: -1 });
knowledgeBaseSchema.index({ featured: 1, "metrics.views": -1 });
knowledgeBaseSchema.index({
  title: "text",
  content: "text",
  tags: "text",
  searchKeywords: "text",
  alternativeTitles: "text",
});
knowledgeBaseSchema.index({ "workflow.sourceQuery": 1 });
knowledgeBaseSchema.index({
  "workflow.approvedBy": 1,
  "workflow.approvalDate": -1,
});

module.exports = mongoose.model("KnowledgeBase", knowledgeBaseSchema);
