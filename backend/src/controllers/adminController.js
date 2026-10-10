const { getOverview } = require('../models/statsModel');

async function overview(req, res, next) {
  try {
    res.json(await getOverview());
  } catch (err) {
    next(err);
  }
}

module.exports = { overview };