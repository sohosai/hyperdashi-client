import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/pages/dashboard/Dashboard'
import { ItemsList } from '@/pages/items/ItemsList'
import { ItemDetail } from '@/pages/items/ItemDetail'
import { ItemForm } from '@/pages/items/ItemForm'
import { LoanForm } from '@/pages/loans/LoanForm'
import { LoansList } from '@/pages/loans/LoansList'
import { CableColorsList } from '@/pages/cable-colors/CableColorsList'
import { LabelGenerator } from '@/pages/labels/LabelGenerator'
import { ContainersList } from '@/pages/containers/ContainersList'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="items">
          <Route index element={<ItemsList />} />
          <Route path="new" element={<ItemForm />} />
          <Route path=":id" element={<ItemDetail />} />
          <Route path=":id/edit" element={<ItemForm />} />
        </Route>
        <Route path="loans">
          <Route index element={<LoansList />} />
          <Route path="new" element={<LoanForm />} />
        </Route>
        <Route path="cable-colors" element={<CableColorsList />} />
        <Route path="labels" element={<LabelGenerator />} />
        <Route path="containers" element={<ContainersList />} />
      </Route>
    </Routes>
  )
}