const Joi = require('@hapi/joi');
const { objectId } = require('./custom.validation');

const createKnowledgeBase = {
  body: Joi.object().keys({
    title: Joi.string().min(5).max(200),
    content: Joi.string().min(10),
    summary: Joi.string().max(300),
    organization: Joi.string().valid('KHUSHII', 'JWP', 'ANIMAL CARE', 'GREEN EARTH', 'EDUCATION FIRST', 'ALL'),
    tags: Joi.array().items(Joi.string()),
    searchKeywords: Joi.array().items(Joi.string()),
    alternativeTitles: Joi.array().items(Joi.string()),
    featured: Joi.boolean()
  })
};

const getKnowledgeBase = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    organization: Joi.string().valid('KHUSHII', 'JWP', 'ANIMAL CARE', 'GREEN EARTH', 'EDUCATION FIRST', 'ALL'),
    status: Joi.string().valid('draft', 'published', 'archived', 'under_review'),
    featured: Joi.boolean(),
    search: Joi.string(),
    tags: Joi.string(),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc')
  })
};

const getKnowledgeBaseEntry = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId)
  })
};

const updateKnowledgeBase = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId)
  }),
  body: Joi.object().keys({
    title: Joi.string().min(5).max(200),
    content: Joi.string().min(10),
    summary: Joi.string().max(300),
    organization: Joi.string().valid('KHUSHII', 'JWP', 'ANIMAL CARE', 'GREEN EARTH', 'EDUCATION FIRST', 'ALL'),
    tags: Joi.array().items(Joi.string()),
    searchKeywords: Joi.array().items(Joi.string()),
    alternativeTitles: Joi.array().items(Joi.string()),
    status: Joi.string().valid('draft', 'published', 'archived', 'under_review'),
    featured: Joi.boolean()
  }).min(1)
};

const searchKnowledgeBase = {
  query: Joi.object().keys({
    q: Joi.string(),
    organization: Joi.string().valid('KHUSHII', 'JWP', 'ANIMAL CARE', 'GREEN EARTH', 'EDUCATION FIRST', 'ALL'),
    tags: Joi.string(),
    limit: Joi.number().integer().min(1).max(50)
  })
};

const rateKnowledgeBase = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId)
  }),
  body: Joi.object().keys({
    rating: Joi.number().min(1).max(5),
    comment: Joi.string().max(200)
  })
};

module.exports = {
  createKnowledgeBase,
  getKnowledgeBase,
  getKnowledgeBaseEntry,
  updateKnowledgeBase,
  searchKnowledgeBase,
  rateKnowledgeBase
}; 