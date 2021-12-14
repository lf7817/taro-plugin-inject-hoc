export default {
  type: 'object',
  properties: {
    hoc: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          path: {
            type: 'string',
          },
          isInject: {
            instanceof: 'Function',
          },
        },
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
};
