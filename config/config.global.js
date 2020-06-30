const config = {};

config.jwtsecret = `YdU9pecapCfKi9sLdVwibLWyIZIKgSga2XS17gUewMSlRk6HV5lZ2uZFvpid`;
config.aessecret = 'tYhIlnLAMRzs06pP3izXkuCn4mwA63Z8FpgXSFLwfy7p6FRozI08VCbfjhEh';
config.email = {
  service: 'SendGrid',
  auth: {
    user: 'apikey',
    pass: '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',
  },
};

module.exports = config;
