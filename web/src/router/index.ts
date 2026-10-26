import { createRouter, createWebHistory } from 'vue-router'
import UserSelectionView from '../views/UserSelectionView.vue'
import SalesOrdersView from '../views/SalesOrdersView.vue'
import TransportOrdersView from '../views/TransportOrdersView.vue'
import TransportOrderDetailView from '../views/TransportOrderDetailView.vue'
import { i18n } from '../i18n'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: () => {
        const hasUser = !!localStorage.getItem('afrikedge_current_user')
        return hasUser ? '/sales-orders' : '/select-user'
      },
    },
    {
      path: '/select-user',
      name: 'select-user',
      component: UserSelectionView,
      meta: { titleKey: 'routes.selectUser' },
    },
    {
      path: '/sales-orders',
      name: 'sales-orders',
      component: SalesOrdersView,
      meta: { titleKey: 'routes.salesOrders' },
    },
    {
      path: '/transport-orders',
      name: 'transport-orders',
      component: TransportOrdersView,
      meta: { titleKey: 'routes.transportOrders' },
    },
    {
      path: '/transport-orders/:no',
      name: 'transport-order-detail',
      component: TransportOrderDetailView,
      meta: { titleKey: 'routes.transportOrderDetail' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/sales-orders',
    },
  ],
})

router.afterEach((to) => {
  const titleKey = to.meta.titleKey as string | undefined
  if (titleKey) {
    document.title = `${i18n.global.t(titleKey)} · Afrikedge`
  }
})

export default router
