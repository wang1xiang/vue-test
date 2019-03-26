import { Tree, Layout, Row, Col, Card, Menu, Icon, Input, Button, Table, Form, Select, Modal, DatePicker, TimePicker, notification, Collapse, Drawer, Spin, Popover, Badge, Avatar, Dropdown, TreeSelect, Checkbox, Tabs, LocaleProvider, Calendar, Popconfirm, message, Switch, List } from 'ant-design-vue'
import Vue from 'vue'

Vue.use(Input)
Vue.use(Menu)
Vue.use(Row)
Vue.use(Col)
Vue.use(Icon)
Vue.use(Card)
Vue.use(Layout)
Vue.use(Tree)
Vue.use(Button)
Vue.use(Table)
Vue.use(Form)
Vue.use(Select)
Vue.use(Modal)
Vue.use(DatePicker)
Vue.use(TimePicker)
Vue.use(Collapse)
Vue.use(Drawer)
Vue.use(Spin)
Vue.use(Popover)
Vue.use(Badge)
Vue.use(Avatar)
Vue.use(Dropdown)
Vue.use(TreeSelect)
Vue.use(Checkbox)
Vue.use(Tabs)
Vue.use(LocaleProvider)
Vue.use(Calendar)
Vue.use(Popconfirm)
Vue.use(Switch)
Vue.use(List)
Vue.prototype.$notification = notification
Vue.prototype.$message = message
message.config({
  duration: 2,
  maxCount: 1
});
