const httpStatus = require('http-status');
const Query = require('../models/Query');
const KnowledgeBase = require('../models/KnowledgeBase');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

const createQuery = catchAsync(async (req, res) => {
  const { title, description, organization, cause, stage, tags } = req.body;

  const query = await Query.create({
    title,
    description,
    organization,
    cause,
    stage,
    tags,
    submittedBy: req.user.id
  });

  await query.populate('submittedBy', 'name email role');

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Query submitted successfully',
    data: { query }
  });
});

const getAllQueries = catchAsync(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    organization, 
    submittedBy,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query = {};
  
  if (status) query.status = status;
  if (organization) query.organization = organization;
  if (submittedBy) query.submittedBy = submittedBy;
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { cause: { $regex: search, $options: 'i' } },
      { stage: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  const sortObj = {};
  sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const queries = await Query.find(query)
    .populate('submittedBy', 'name email role')
    .populate('answers.providedBy', 'name email role')
    .populate('solution.providedBy', 'name email role')
    .populate('adminReview.reviewedBy', 'name email role')
    .sort(sortObj)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Query.countDocuments(query);

  res.json({
    success: true,
    data: {
      queries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

const getQueryById = catchAsync(async (req, res) => {
  const query = await Query.findById(req.params.id)
    .populate('submittedBy', 'name email role organization')
    .populate('answers.providedBy', 'name email role')
    .populate('solution.providedBy', 'name email role')
    .populate('adminReview.reviewedBy', 'name email role')
    .populate('knowledgeBaseEntry')
    .populate('comments.user', 'name email role');

  if (!query) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Query not found');
  }

  // Increment view count
  query.views += 1;
  await query.save();

  res.json({
    success: true,
    data: { query }
  });
});

const updateQuery = catchAsync(async (req, res) => {
  const { title, description, organization, cause, stage, tags, status } = req.body;

  const query = await Query.findById(req.params.id);
  
  if (!query) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Query not found');
  }

  // Check permissions
  if (req.user.role === 'sales_executive' && query.submittedBy.toString() !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only update your own queries');
  }

  const updatedQuery = await Query.findByIdAndUpdate(
    req.params.id,
    { title, description, organization, cause, stage, tags, status },
    { new: true, runValidators: true }
  ).populate('submittedBy', 'name email role');

  res.json({
    success: true,
    message: 'Query updated successfully',
    data: { query: updatedQuery }
  });
});

const deleteQuery = catchAsync(async (req, res) => {
  const query = await Query.findById(req.params.id);
  
  if (!query) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Query not found');
  }

  // Check permissions
  if (req.user.role === 'sales_executive' && query.submittedBy.toString() !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only delete your own queries');
  }

  await Query.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Query deleted successfully'
  });
});

const addAnswer = catchAsync(async (req, res) => {
  const { content, helpful, managerNotes } = req.body;

  const query = await Query.findById(req.params.id);
  
  if (!query) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Query not found');
  }

  const answer = {
    content,
    providedBy: req.user.id,
    providedAt: new Date(),
    helpful,
    managerNotes
  };

  query.answers.push(answer);
  query.actionCounts.answers += 1;

  // Update status if first answer
  if (query.status === 'new' || query.status === 'assigned') {
    query.status = 'under_discussion';
  }

  await query.save();
  await query.populate('answers.providedBy', 'name email role');

  res.json({
    success: true,
    message: 'Answer added successfully',
    data: { query }
  });
});

const provideSolution = catchAsync(async (req, res) => {
  const { content, managerNotes } = req.body;

  const query = await Query.findById(req.params.id);
  
  if (!query) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Query not found');
  }

  query.solution = {
    content,
    providedBy: req.user.id,
    providedAt: new Date(),
    managerNotes
  };

  query.status = 'solution_provided';
  query.workflow.currentStage = 'admin_review';
  query.workflow.stageStartedAt = new Date();

  await query.save();
  await query.populate('solution.providedBy', 'name email role');

  res.json({
    success: true,
    message: 'Solution provided successfully',
    data: { query }
  });
});

const reviewSolution = catchAsync(async (req, res) => {
  const { 
    status, 
    editedSolution, 
    adminFeedback, 
    approvalReason, 
    rejectionReason 
  } = req.body;

  const query = await Query.findById(req.params.id);
  
  if (!query) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Query not found');
  }

  // Check if there's a solution to review (business logic check)
  if (!query.solution || !query.solution.content) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No solution provided for this query');
  }

  // Store original solution if editing
  if (!query.adminReview) {
    query.adminReview = {};
  }
  if (!query.adminReview.originalSolution) {
    query.adminReview.originalSolution = query.solution.content;
  }

  query.adminReview = {
    ...query.adminReview,
    reviewedBy: req.user.id,
    reviewedAt: new Date(),
    status,
    editedSolution: editedSolution || query.solution.content,
    adminFeedback,
    approvalReason,
    rejectionReason
  };

  if (status === 'approved') {
    query.status = 'approved';
    query.workflow.currentStage = 'completed';
    
    // If solution was edited, update the main solution
    if (editedSolution) {
      query.solution.content = editedSolution;
    }
  } else if (status === 'rejected') {
    query.status = 'rejected';
    query.workflow.currentStage = 'manager_review';
  }

  await query.save();
  await query.populate('adminReview.reviewedBy', 'name email role');

  res.json({
    success: true,
    message: `Solution ${status} successfully`,
    data: { query }
  });
});

const publishToKnowledgeBase = catchAsync(async (req, res) => {
  const { title, summary, tags, searchKeywords, alternativeTitles } = req.body;

  const query = await Query.findById(req.params.id);
  
  if (!query) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Query not found');
  }

  if (query.status !== 'approved') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only approved queries can be published to knowledge base');
  }

  // Ensure we have content to publish
  const content = query.adminReview?.editedSolution || query.solution?.content;
  if (!content) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No solution content available for publishing');
  }

  const knowledgeBaseEntry = await KnowledgeBase.create({
    title: title || query.title || 'Untitled',
    content,
    summary,
    organization: query.organization,
    tags: tags || query.tags,
    searchKeywords,
    alternativeTitles,
    workflow: {
      sourceQuery: query._id,
      solutionProvider: query.solution?.providedBy,
      originalSolution: query.adminReview?.originalSolution || query.solution?.content,
      approvedBy: query.adminReview?.reviewedBy,
      approvalDate: query.adminReview?.reviewedAt,
      adminEdits: query.adminReview?.adminFeedback,
      publishedAt: new Date()
    },
    createdBy: req.user.id
  });

  query.knowledgeBaseEntry = knowledgeBaseEntry._id;
  query.status = 'published';
  await query.save();

  res.json({
    success: true,
    message: 'Query published to knowledge base successfully',
    data: { knowledgeBaseEntry }
  });
});

const addComment = catchAsync(async (req, res) => {
  const { message, type = 'comment' } = req.body;

  const query = await Query.findById(req.params.id);
  
  if (!query) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Query not found');
  }

  const comment = {
    user: req.user.id,
    message,
    type,
    createdAt: new Date()
  };

  query.comments.push(comment);
  query.actionCounts.comments += 1;

  await query.save();
  await query.populate('comments.user', 'name email role');

  res.json({
    success: true,
    message: 'Comment added successfully',
    data: { query }
  });
});

const getQueryStats = catchAsync(async (req, res) => {
  const stats = await Query.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
        assigned: { $sum: { $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0] } },
        underDiscussion: { $sum: { $cond: [{ $eq: ['$status', 'under_discussion'] }, 1, 0] } },
        solutionProvided: { $sum: { $cond: [{ $eq: ['$status', 'solution_provided'] }, 1, 0] } },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } }
      }
    }
  ]);

  const organizationStats = await Query.aggregate([
    {
      $group: {
        _id: '$organization',
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      overall: stats[0] || {},
      byOrganization: organizationStats
    }
  });
});

module.exports = {
  createQuery,
  getAllQueries,
  getQueryById,
  updateQuery,
  deleteQuery,
  addAnswer,
  provideSolution,
  reviewSolution,
  publishToKnowledgeBase,
  addComment,
  getQueryStats
};