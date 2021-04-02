const logger = require("hexo-log")();
const { Component } = require("inferno");
const view = require("hexo-component-inferno/lib/core/view");
const classname = require("hexo-component-inferno/lib/util/classname");

function getPageName(page) {
  if (!page) {
    return "";
  }
  // logger.info("page-name:" + JSON.stringify(page, null, 2));
  if (page.__index === true) {
    return "index";
  } else if (page.archive === true) {
    return "archive";
  } else if (page.__categories === true) {
    return "category";
  } else if (page.__tags === true) {
    return "tag";
  } else if (page.__post === true) {
    return "post";
  }
  // 默认为普通页面
  return "page";
}

function formatWidgets(widgets, page) {
  const result = {};
  if (Array.isArray(widgets)) {
    widgets
      .filter((widget) => typeof widget === "object")
      .forEach((widget) => {
        if ("pages" in widget && typeof widget.pages === "object") {
          const pageName = getPageName(page);
          // logger.info("page-name:" + pageName);
          if (pageName) {
            var pageShow = false;
            widget.pages.forEach((item) => {
              if (item === pageName) {
                pageShow = true;
              }
            });
            if (!pageShow) {
              return;
            }
          } else {
            return;
          }
        }
        if (
          "position" in widget &&
          (widget.position === "left" || widget.position === "right")
        ) {
          if (!(widget.position in result)) {
            result[widget.position] = [widget];
          } else {
            result[widget.position].push(widget);
          }
        }
      });
  }
  return result;
}

function hasColumn(widgets, page, position) {
  const pageName = getPageName(page);
  if (pageName) {
    var hasColumn = false;
    if (Array.isArray(widgets)) {
      const pageName = getPageName(page);
      widgets.forEach((widget) => {
        var hasPos = widget.position === position;
        var hasPage = false;
        if (!("pages" in widget)) {
          hasPage = true;
        } else if (Array.isArray(widget.pages)) {
          widget.pages.forEach((item) => {
            if (item === pageName) {
              hasPage = true;
              return;
            }
          });
        }
        if (hasPos && hasPage) {
          hasColumn = true;
          return;
        }
      });
    }
    return hasColumn;
  }

  if (Array.isArray(widgets)) {
    return (
      typeof widgets.find((widget) => widget.position === position) !==
      "undefined"
    );
  }
  return false;
}

function getColumnCount(widgets, page) {
  let wcheck = [
    hasColumn(widgets, page, "left"),
    hasColumn(widgets, page, "right"),
  ];
  let ccount = wcheck.filter((v) => !!v).length + 1;
  // logger.info("column-count:" + JSON.stringify(wcheck) + " " + ccount);
  return ccount;
}

function getColumnSizeClass(columnCount) {
  switch (columnCount) {
    case 2:
      return "is-4-tablet is-4-desktop is-4-widescreen";
    case 3:
      return "is-4-tablet is-4-desktop is-3-widescreen";
  }
  return "";
}

function getColumnVisibilityClass(columnCount, position) {
  if (columnCount === 3 && position === "right") {
    return "is-hidden-touch is-hidden-desktop-only";
  }
  return "";
}

function getColumnOrderClass(position) {
  return position === "left" ? "order-1" : "order-3";
}

function isColumnSticky(config, position) {
  return (
    typeof config.sidebar === "object" &&
    position in config.sidebar &&
    config.sidebar[position].sticky === true
  );
}

function isPageSticky(config, page, position) {
  const pageName = getPageName(page);
  if (pageName) {
    const pageSticky = "page_" + pageName;
    // logger.info("page-sidebar:" + JSON.stringify(config.sidebar));
    // logger.info("page-sticky-nm:" + JSON.stringify(pageSticky));
    if (typeof config.sidebar === "object" && config.sidebar[pageSticky]) {
      const pageConf = config.sidebar[pageSticky];
      // logger.info("page-sticky-conf:" + JSON.stringify(pageConf));
      return position in pageConf && pageConf[position].sticky === true;
    }
  }
  return false;
}

class Widgets extends Component {
  render() {
    const { site, config, helper, page, position } = this.props;
    const widgets = formatWidgets(config.widgets, page)[position] || [];
    const columnCount = getColumnCount(config.widgets, page);

    if (!widgets.length) {
      return null;
    }

    return (
      <div
        class={classname({
          column: true,
          ["column-" + position]: true,
          [getColumnSizeClass(columnCount)]: true,
          [getColumnVisibilityClass(columnCount, position)]: true,
          [getColumnOrderClass(position)]: true,
          "is-sticky":
            isPageSticky(config, page, position) ||
            isColumnSticky(config, position),
        })}
      >
        {widgets.map((widget) => {
          // widget type is not defined
          if (!widget.type) {
            return null;
          }
          try {
            let Widget = view.require("widget/" + widget.type);
            Widget = Widget.Cacheable ? Widget.Cacheable : Widget;
            return (
              <Widget
                site={site}
                helper={helper}
                config={config}
                page={page}
                widget={widget}
              />
            );
          } catch (e) {
            logger.w(`Icarus cannot load widget "${widget.type}"`);
          }
          return null;
        })}
        {position === "left" && hasColumn(config.widgets, "right") ? (
          <div
            class={classname({
              "column-right-shadow": true,
              "is-hidden-widescreen": true,
              "is-sticky": isColumnSticky(config, "right"),
            })}
          ></div>
        ) : null}
      </div>
    );
  }
}

Widgets.getColumnCount = getColumnCount;

module.exports = Widgets;
