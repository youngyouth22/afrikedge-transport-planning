import { createRouter, createWebHistory } from 'vue-router'
import UserSelectionView from '../views/UserSelectionView.vue'
import SalesOrdersView from '../views/SalesOrdersView.vue'
import TransportOrdersView from '../views/TransportOrdersView.vue'
import TransportOrderDetailView from '../views/TransportOrderDetailView.vue'

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
      meta: { title: 'Choix du profil' },
    },
    {
      path: '/sales-orders',
      name: 'sales-orders',
      component: SalesOrdersView,
      meta: { title: 'Commandes à planifier' },
    },
    {
      path: '/transport-orders',
      name: 'transport-orders',
      component: TransportOrdersView,
      meta: { title: 'Ordres de transport' },
    },
    {
      path: '/transport-orders/:no',
      name: 'transport-order-detail',
      component: TransportOrderDetailView,
      meta: { title: 'Détail du transport' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/sales-orders',
    },
  ],
})

export default router
