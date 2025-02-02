const { Component } = require("inferno");
const Article = require("./common/page");

module.exports = class extends Component {
  render() {
    const { config, page, helper } = this.props;

    return (
      <Article config={config} page={page} helper={helper} index={false} />
    );
  }
};
