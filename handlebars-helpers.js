var _ = require('lodash');
var Handlebars = require('handlebars');

module.exports = {
  attr: function(value) {
    return _.kebabCase(value);
  },
  compare: function (lvalue, operator, rvalue, options) {
    var operators, result;

    if (arguments.length < 3) {
      throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
    }

    if (options === undefined) {
      options = rvalue;
      rvalue = operator;
      operator = "===";
    }

    operators = {
      '==': function (l, r) { return l == r; },
      '===': function (l, r) { return l === r; },
      '!=': function (l, r) { return l != r; },
      '!==': function (l, r) { return l !== r; },
      '<': function (l, r) { return l < r; },
      '>': function (l, r) { return l > r; },
      '<=': function (l, r) { return l <= r; },
      '>=': function (l, r) { return l >= r; },
      'typeof': function (l, r) { return typeof l == r; }
    };

    if (!operators[operator]) {
      throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
    }

    result = operators[operator](lvalue, rvalue);

    if (result) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }

  },
  default: function (value, defaultValue) {
    return value ? value : defaultValue;
  },
  'default-each': function(context, defaultContext, options) {
    if (!options) {
      throw new Error('Must pass iterator and default value to #default-each');
    }

    let fn = options.fn,
        inverse = options.inverse,
        i = 0,
        ret = '',
        data;

    context = context || defaultContext;

    if (_.isFunction(context)) { context = context.call(this); }

    if (options.data) {
      data = Handlebars.createFrame(options.data);
    }

    function execIteration(field, index, last) {
      if (data) {
        data.key = field;
        data.index = index;
        data.first = index === 0;
        data.last = !!last;
      }

      ret = ret + fn(context[field], {
        data: data,
        blockParams: [context[field], field]
      });
    }

    if (context && typeof context === 'object') {
      if (Array.isArray(context)) {
        for (let j = context.length; i < j; i++) {
          if (i in context) {
            execIteration(i, i, i === context.length - 1);
          }
        }
      } else {
        let priorKey;

        for (let key in context) {
          if (context.hasOwnProperty(key)) {
            // We're running the iterations one step out of sync so we can detect
            // the last iteration without have to scan the object twice and create
            // an itermediate keys array.
            if (priorKey !== undefined) {
              execIteration(priorKey, i - 1);
            }
            priorKey = key;
            i++;
          }
        }
        if (priorKey !== undefined) {
          execIteration(priorKey, i - 1, true);
        }
      }
    }

    if (i === 0) {
      ret = inverse(this);
    }

    return ret;
  },
  'default-with': function(context, defaultContext, options) {
    if (!options) {
      throw new Error('Must pass iterator and default value to #default-each');
    }

    context = context || defaultContext;

    if (_.isFunction(context)) { context = context.call(this); }

    let fn = options.fn;

    if (!_.isEmpty(context)) {
      let data = options.data;

      return fn(context, {
        data: data,
        blockParams: [context]
      });
    } else {
      return options.inverse(this);
    }
  },
};
