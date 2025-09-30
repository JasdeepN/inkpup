const React = require('react');
module.exports = function Image(props) {
  const { src, alt, width, height, className } = props;
  return React.createElement('img', { src, alt, width, height, className });
};
