/*eslint-disable */
var Alt = require("alt");
var AltContainer = require("alt/AltContainer");
var React = require("react");

var alt = new Alt();

var node = React.createElement(AltContainer, { flux: alt });

module.exports = node;