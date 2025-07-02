const Joi = require('@hapi/joi');
const { objectId } = require('./custom.validation');

const createQuery = {
  body: Joi.object().keys({
    title: Joi.string().min(5).max(200),
    description: Joi.string().min(10).max(2000),
    organization: Joi.string().valid('KHUSHII', 'JWP', 'ANIMAL CARE', 'GREEN EARTH', 'EDUCATION FIRST'),
    cause: Joi.string().max(200),
    stage: Joi.string().max(100),
    tags: Joi.array().items(Joi.string())
  })
};

const getQueries = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    status: Joi.string().valid('new', 'assigned', 'under_discussion', 'solution_provided', 'pending_review', 'approved', 'rejected', 'published', 'archived'),
    organization: Joi.string().valid('KHUSHII', 'JWP', 'ANIMAL CARE', 'GREEN EARTH', 'EDUCATION FIRST'),
    submittedBy: Joi.string().custom(objectId),
    search: Joi.string(),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc')
  })
};

const getQuery = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId)
  })
};

const updateQuery = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId)
  }),
  body: Joi.object().keys({
    title: Joi.string().min(5).max(200),
    description: Joi.string().min(10).max(2000),
    organization: Joi.string().valid('KHUSHII', 'JWP', 'ANIMAL CARE', 'GREEN EARTH', 'EDUCATION FIRST'),
    cause: Joi.string().max(200),
    stage: Joi.string().max(100),
    tags: Joi.array().items(Joi.string()),
    status: Joi.string().valid('new', 'assigned', 'under_discussion', 'solution_provided', 'pending_review', 'approved', 'rejected', 'published', 'archived')
  }).min(1)
};

const addAnswer = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId)
  }),
  body: Joi.object().keys({
    content: Joi.string().max(5000),
    helpful: Joi.boolean(),
    managerNotes: Joi.string().max(1000)
  })
};

const provideSolution = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId)
  }),
  body: Joi.object().keys({
    content: Joi.string().max(5000),
    managerNotes: Joi.string().max(1000)
  })
};

const reviewSolution = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId)
  }),
  body: Joi.object().keys({
    status: Joi.string().valid('approved', 'rejected'),
    editedSolution: Joi.string().max(5000),
    adminFeedback: Joi.string().max(500),
    approvalReason: Joi.string().max(300),
    rejectionReason: Joi.string().max(300)
  })
};

const addComment = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId)
  }),
  body: Joi.object().keys({
    message: Joi.string().max(1000),
    type: Joi.string().valid('comment', 'solution', 'review', 'approval', 'rejection').default('comment')
  })
};

module.exports = {
  createQuery,
  getQueries,
  getQuery,
  updateQuery,
  addAnswer,
  provideSolution,
  reviewSolution,
  addComment
}; 