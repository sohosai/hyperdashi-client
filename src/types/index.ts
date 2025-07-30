export interface Item {
  id: number
  name: string
  label_id: string
  model_number?: string
  remarks?: string
  purchase_year?: number
  purchase_amount?: number
  durability_years?: number
  is_depreciation_target?: boolean
  connection_names?: string[]
  cable_color_pattern?: string[]
  storage_location?: string
  container_id?: string
  storage_type: string
  is_on_loan?: boolean
  qr_code_type?: 'qr' | 'barcode' | 'none'
  is_disposed?: boolean
  image_url?: string
  created_at: string
  updated_at: string
}

export interface Loan {
  id: number
  item_id: number
  student_number: string
  student_name: string
  organization?: string
  loan_date: string
  return_date?: string
  remarks?: string
  created_at: string
  updated_at: string
  item?: Item
}

export interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface CableColor {
  id: number
  name: string
  hex_code: string
  created_at: string
  updated_at: string
}

export interface ApiError {
  message: string
  status: number
  errors?: Record<string, string[]>
}