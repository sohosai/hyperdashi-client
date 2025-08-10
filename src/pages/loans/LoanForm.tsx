import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
  Snippet,
} from '@heroui/react'
import { ArrowLeft, Save } from 'lucide-react'
import { useItem, useCreateLoan } from '@/hooks'

type LoanFormData = {
  item_id: string
  student_number: string
  student_name: string
  organization?: string
  loan_date: string
  remarks?: string
}

export function LoanForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const [submitError, setSubmitError] = useState<string | null>(null)
  
  // Get item_id from URL query parameter
  const searchParams = new URLSearchParams(location.search)
  const itemId = searchParams.get('item_id')
  
  // Fetch specific item data if item_id is provided
  const { data: selectedItem } = useItem(itemId || '')
  
  // Create loan mutation
  const createLoanMutation = useCreateLoan()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoanFormData>({
    defaultValues: {
      item_id: itemId || '',
      student_number: '',
      student_name: '',
      organization: '',
      loan_date: new Date().toISOString().split('T')[0],
      remarks: '',
    },
  })

  // Update form when item_id is available
  useEffect(() => {
    if (itemId) {
      setValue('item_id', itemId)
    }
  }, [itemId, setValue])

  const onSubmit = async (data: LoanFormData) => {
    try {
      setSubmitError(null)
      
      // Validate required fields
      if (!data.item_id) {
        setSubmitError('備品を選択してください。')
        return
      }
      
      if (!data.student_number?.trim()) {
        setSubmitError('学籍番号は必須です。')
        return
      }
      
      if (!data.student_name?.trim()) {
        setSubmitError('氏名は必須です。')
        return
      }
      
      if (!data.loan_date) {
        setSubmitError('貸出日は必須です。')
        return
      }
      
      // Clean and prepare data for API
      const loanData = {
        item_id: data.item_id,
        student_number: data.student_number.trim(),
        student_name: data.student_name.trim(),
        organization: data.organization?.trim() || undefined,
        loan_date: data.loan_date,
        remarks: data.remarks?.trim() || undefined,
      }
      
      await createLoanMutation.mutateAsync(loanData)
      navigate('/items')
    } catch (error: any) {
      console.error('Loan creation error:', error)
      
      let errorMessage = '貸出登録に失敗しました。'
      
      if (error?.response?.status === 400) {
        errorMessage = 'リクエストデータに問題があります。入力内容を確認してください。'
        if (error.response?.data?.message) {
          errorMessage += ` (${error.response.data.message})`
        }
      } else if (error?.response?.status === 404) {
        errorMessage = '指定された備品が見つかりません。'
      } else if (error?.response?.status === 409) {
        errorMessage = 'この備品は既に貸出中です。'
      } else if (error?.response?.status === 500) {
        errorMessage = 'サーバーエラーが発生しました。管理者に連絡してください。'
      } else if (error?.message?.includes('Network Error')) {
        errorMessage = 'ネットワーク接続を確認してください。'
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setSubmitError(errorMessage)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <Button
          as={Link}
          to="/items"
          variant="light"
          startContent={<ArrowLeft size={20} />}
          size="sm"
        >
          備品一覧に戻る
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold">新規貸出登録</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <h2 className="text-lg sm:text-xl font-semibold">貸出情報</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">
                  貸出備品 <span className="text-danger">*</span>
                </label>
                {selectedItem ? (
                  <Card>
                    <CardBody className="p-4">
                      <div className="flex items-center gap-4">
                        {selectedItem.image_url && (
                          <img 
                            src={selectedItem.image_url} 
                            alt={selectedItem.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{selectedItem.name}</h3>
                          <p className="text-sm text-gray-600">ラベルID: {selectedItem.label_id}</p>
                          {selectedItem.model_number && (
                            <p className="text-sm text-gray-600">型番: {selectedItem.model_number}</p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              利用可能
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ) : (
                  <div className="text-sm text-gray-500 p-4 border rounded-lg">
                    備品情報を読み込み中...
                  </div>
                )}
                <input type="hidden" {...register('item_id', { required: '備品を選択してください' })} />
              </div>

              <Input
                {...register('loan_date', { required: '貸出日は必須です' })}
                type="date"
                label="貸出日"
                errorMessage={errors.loan_date?.message}
                isInvalid={!!errors.loan_date}
                isRequired
              />

              <Input
                {...register('student_number', { required: '学籍番号は必須です' })}
                label="学籍番号"
                placeholder="例: 2023001"
                errorMessage={errors.student_number?.message}
                isInvalid={!!errors.student_number}
                isRequired
              />

              <Input
                {...register('student_name', { required: '氏名は必須です' })}
                label="氏名"
                placeholder="例: 山田太郎"
                errorMessage={errors.student_name?.message}
                isInvalid={!!errors.student_name}
                isRequired
              />

              <Input
                {...register('organization')}
                label="所属"
                placeholder="例: 情報工学科"
                className="sm:col-span-2"
              />
            </div>

            <div className="mt-4">
              <Textarea
                {...register('remarks')}
                label="備考"
                placeholder="貸出に関する追加情報を入力してください"
                rows={4}
              />
            </div>
          </CardBody>
        </Card>

        {submitError && (
          <Card className="mt-4">
            <CardBody>
              <Snippet color="danger" variant="flat" symbol="⚠️">
                {submitError}
              </Snippet>
            </CardBody>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-6">
          <Button
            as={Link}
            to="/items"
            variant="flat"
            isDisabled={createLoanMutation.isPending}
            size="sm"
            className="text-xs sm:text-sm order-2 sm:order-1"
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            color="primary"
            startContent={<Save size={16} />}
            isLoading={createLoanMutation.isPending}
            size="sm"
            className="text-xs sm:text-sm order-1 sm:order-2"
          >
            登録
          </Button>
        </div>
      </form>
    </div>
  )
}
