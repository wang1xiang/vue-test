let _Vue = null;
export default class VueRouter {
  static install(Vue) {
    // 判断是否已加载过
    if (this.install.installed) {
      return;
    }
    this.install.installed = true;
    // 记录全局_Vue实例
    _Vue = Vue;

    Vue.mixin({
      beforeCreate() {
        if (this.$options.router) {
          Vue.prototype.$router = this.$options.router;
        }
      }
    })

  }
  constructor(options) {
    this.options = options;
    this.routeMap = {};
    this.data = _Vue.observable({
      data: '/'
    })
    this.init();
  }

  init() {
    this.initRouteMap();
    this.initComponent();
    this.initEvent();
  }

  initRouteMap() {
    this.options.routes.forEach(item => {
      const { path, component } = item;
      this.routeMap[path] = component;
    })
  }
  initComponent() {
    _Vue.component('RouterLink', {
      props: {
        to: String
      },
      render(h) {
        return h('a', {
          attrs: {
            href: this.to
          },
          on: {
            click: this.clickHandler
          }
        }, [this.$slots.default])
      },
      methods: {
        clickHandler(e) {
          history.pushState({}, '', this.to);
          this.data.current = this.to;
          e.preventDefault();
        }
      }
    })
    const self = this;
    _Vue.component('RouterView', {
      render(h) {
        const cm = self.routeMap[self.data.current];
        return h(cm);
      }
    })
  }
  initEvent() {
    window.addEventListener('popstate', () => {
      this.data.current = window.location.pathname;
    })
  }
}