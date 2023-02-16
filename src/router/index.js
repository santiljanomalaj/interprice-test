import Vue from 'vue'
import Router from 'vue-router'
import TableGrid from '@/components/TableGrid'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'TableGrid',
      component: TableGrid
    }
  ]
})
