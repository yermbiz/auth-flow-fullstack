const logger = require('../utils/logger');
const policiesRepo = require('../repositories/policies');

const getLatestPolicies = async (req, res) => {
  try {
    logger.info('Fetching the latest policy versions.');

    const latestPolicies = await policiesRepo.getLatestPolicies();
    logger.debug('Latest policies retrieved:', latestPolicies);

    res.status(200).json(
      latestPolicies.map((p) => {
        logger.debug(`Policy content URL generated for type: ${p.type}, version: ${p.version}`);
        return { ...p, content_url: `/policies/${p.type}-${p.version}` };
      })
    );
  } catch (error) {
    logger.error('Error fetching the latest policy versions:', { error });
    res.status(500).json({ error: 'Failed to fetch policy versions' });
  }
};

const getPolicyByTypeAndVersion = async (req, res) => {
  const { type, version } = req.params;

  logger.info(`Fetching policy with type: ${type}, version: ${version}.`);

  try {
    const policy = await policiesRepo.getByTypeAndVersion(type, version);
    if (!policy) {
      logger.warn(`Policy not found for type: ${type}, version: ${version}`);
      return res.status(404).json({ error: 'Policy not found' });
    }

    logger.debug(`Policy retrieved: ${JSON.stringify(policy)}`);
    res.json(policy);
  } catch (err) {
    logger.error(`Error fetching policy for type: ${type}, version: ${version}:`, { error: err });
    res.status(500).json({ error: 'Failed to fetch policy content' });
  }
};

module.exports = {
  getLatestPolicies,
  getPolicyByTypeAndVersion,
};
