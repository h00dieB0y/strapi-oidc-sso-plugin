
export default [
    {
      method: 'GET',
      path: '/',
      // name of the controller file & the method.
      handler: 'controller.authenticate',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/callback',
      handler: 'controller.callback',
      config: {
        policies: [],
        auth: false,
      },
    },
  ];
  