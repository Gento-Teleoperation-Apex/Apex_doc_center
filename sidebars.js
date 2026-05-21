/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  mainSidebar: [
    'index',
    {
      type: 'category',
      label: '产品介绍',
      items: [
        'product-introduction/overview',
        'product-introduction/specifications',
        'product-introduction/components',
        'product-introduction/accessories',
        'product-introduction/software',
      ],
    },
    {
      type: 'category',
      label: '快速入门',
      items: [
        'getting-started/install_usage_guide',
      ],
    },
  ],
};

module.exports = sidebars;
