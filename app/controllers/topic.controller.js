const TopicModel = require('../models/topic.model');

class TopicController {
  static async createTopic(req, res) {
    try {
      const topic = await TopicModel.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Topic created successfully',
        data: topic
      });
    } catch (error) {
      console.error('Create topic error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async getTopics(req, res) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      
      const result = await TopicModel.findAll(
        parseInt(page),
        parseInt(limit),
        search
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get topics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async getTopicById(req, res) {
    try {
      const { id } = req.params;
      const topic = await TopicModel.findById(id);

      if (!topic) {
        return res.status(404).json({
          success: false,
          message: 'Topic not found'
        });
      }

      res.json({
        success: true,
        data: topic
      });
    } catch (error) {
      console.error('Get topic by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async updateTopic(req, res) {
    try {
      const { id } = req.params;
      const topic = await TopicModel.findById(id);

      if (!topic) {
        return res.status(404).json({
          success: false,
          message: 'Topic not found'
        });
      }

      const updatedTopic = await TopicModel.update(id, req.body);

      res.json({
        success: true,
        message: 'Topic updated successfully',
        data: updatedTopic
      });
    } catch (error) {
      console.error('Update topic error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async deleteTopic(req, res) {
    try {
      const { id } = req.params;
      const topic = await TopicModel.findById(id);

      if (!topic) {
        return res.status(404).json({
          success: false,
          message: 'Topic not found'
        });
      }

      await TopicModel.delete(id);

      res.json({
        success: true,
        message: 'Topic deleted successfully'
      });
    } catch (error) {
      console.error('Delete topic error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async addUserToTopic(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const topic = await TopicModel.findById(id);
      if (!topic) {
        return res.status(404).json({
          success: false,
          message: 'Topic not found'
        });
      }

      const topicUser = await TopicModel.addUser(id, userId);

      res.json({
        success: true,
        message: 'Added to topic successfully',
        data: topicUser
      });
    } catch (error) {
      console.error('Add user to topic error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async removeUserFromTopic(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const topic = await TopicModel.findById(id);
      if (!topic) {
        return res.status(404).json({
          success: false,
          message: 'Topic not found'
        });
      }

      await TopicModel.removeUser(id, userId);

      res.json({
        success: true,
        message: 'Removed from topic successfully'
      });
    } catch (error) {
      console.error('Remove user from topic error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async getUserTopics(req, res) {
    try {
      const userId = req.user.id;
      const topics = await TopicModel.findByUser(userId);

      res.json({
        success: true,
        data: topics
      });
    } catch (error) {
      console.error('Get user topics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async getPopularTopics(req, res) {
    try {
      const { limit = 10 } = req.query;
      const topics = await TopicModel.getPopular(parseInt(limit));

      res.json({
        success: true,
        data: topics
      });
    } catch (error) {
      console.error('Get popular topics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async searchTopics(req, res) {
    try {
      const { q, limit = 10 } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const topics = await TopicModel.search(q, parseInt(limit));

      res.json({
        success: true,
        data: topics
      });
    } catch (error) {
      console.error('Search topics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = TopicController;
