import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
  Switch,
  Select,
  SelectItem,
  Spinner,
  Snippet,
} from '@heroui/react'
import { ArrowLeft, Save } from 'lucide-react'
import { Item } from '@/types'
import { useItem, useCreateItem, useUpdateItem, useItemSuggestions, useContainers } from '@/hooks'
import { ArrayInput } from '@/components/ui/ArrayInput'
import { CableColorInput } from '@/components/ui/CableColorInput'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { SingleLocationInput } from '@/components/ui/SingleLocationInput'

type ItemFormData = Omit<Item, 'id' | 'created_at' | 'updated_at' | 'storage_locations'> & { storage_location?: string }

export function ItemForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const itemId = id ? Number(id) : undefined

  // Fetch item data for edit mode
  const { data: item, isLoading: isLoadingItem, error: itemError } = useItem(itemId || 0)
  
  // Fetch suggestions for array fields
  const { data: connectionSuggestions = [] } = useItemSuggestions('connection_names')
  const { data: locationSuggestions = [] } = useItemSuggestions('storage_location')
  
  // Fetch containers for container selection
  const { containers = [] } = useContainers()
  
  // Debug logs (development only)
  if (import.meta.env.VITE_DEV_MODE === 'true') {
    console.log('ItemForm Debug:', { 
      id, 
      itemId, 
      isEdit, 
      item, 
      isLoadingItem, 
      itemError 
    })
  }
  
  // Mutations
  const createItemMutation = useCreateItem()
  const updateItemMutation = useUpdateItem()
  
  // Error state
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ItemFormData>({
    defaultValues: {
      name: '',
      label_id: '',
      model_number: '',
      remarks: '',
      purchase_year: undefined,
      purchase_amount: undefined,
      durability_years: undefined,
      is_depreciation_target: false,
      connection_names: [],
      cable_color_pattern: [],
      storage_location: '',
      container_id: '',
      storage_type: 'location',
      qr_code_type: 'none',
      is_disposed: false,
      image_url: '',
    },
    mode: 'onChange',
  })

  // Get current form values
  const formValues = watch()
  
  // Debug: Watch form values (development only)
  if (import.meta.env.VITE_DEV_MODE === 'true') {
    console.log('Form values:', formValues)
  }

  // Reset form with item data when editing
  useEffect(() => {
    if (isEdit && item) {
      if (import.meta.env.VITE_DEV_MODE === 'true') {
        console.log('Setting form values with item data:', item)
      }
      
      // Set values individually to ensure they're applied
      setValue('name', item.name || '')
      setValue('label_id', item.label_id || '')
      setValue('model_number', item.model_number || '')
      setValue('remarks', item.remarks || '')
      setValue('purchase_year', item.purchase_year)
      setValue('purchase_amount', item.purchase_amount)
      setValue('durability_years', item.durability_years)
      setValue('is_depreciation_target', !!item.is_depreciation_target)
      setValue('connection_names', item.connection_names || [])
      setValue('cable_color_pattern', item.cable_color_pattern || [])
      setValue('storage_location', item.storage_location || '')
      setValue('qr_code_type', item.qr_code_type || 'none')
      setValue('is_disposed', !!item.is_disposed)
      setValue('image_url', item.image_url || '')
      setValue('container_id', item.container_id || '')
      setValue('storage_type', item.storage_type || 'location')
      
      if (import.meta.env.VITE_DEV_MODE === 'true') {
        console.log('Form values set individually')
      }
    }
  }, [item, isEdit, setValue])

  const onSubmit = async (data: ItemFormData) => {
    try {
      setSubmitError(null)
      
      // Validate required fields
      if (!data.name?.trim()) {
        setSubmitError('備品名は必須です。')
        return
      }
      
      if (!data.label_id?.trim()) {
        setSubmitError('ラベルIDは必須です。')
        return
      }
      
      if (data.storage_type === 'container' && !data.container_id?.trim()) {
        setSubmitError('コンテナで保管する場合、コンテナの選択は必須です。')
        return
      }
      
      // Clean and transform data for API
      const cleanedData = {
        // Required fields - ensure they are present
        name: data.name?.trim() || '',
        label_id: data.label_id?.trim() || '',
        // Optional string fields
        model_number: data.model_number?.trim() || undefined,
        remarks: data.remarks?.trim() || undefined,
        // Numeric fields - only include if they have valid values
        ...(data.purchase_year && !isNaN(Number(data.purchase_year)) && { purchase_year: Number(data.purchase_year) }),
        ...(data.purchase_amount && !isNaN(Number(data.purchase_amount)) && { purchase_amount: Number(data.purchase_amount) }),
        ...(data.durability_years && !isNaN(Number(data.durability_years)) && { durability_years: Number(data.durability_years) }),
        // Boolean fields - provide defaults
        is_depreciation_target: Boolean(data.is_depreciation_target),
        is_disposed: Boolean(data.is_disposed),
        // QR code type - ensure valid value
        qr_code_type: data.qr_code_type || 'none',
        // Array fields - ensure they are arrays
        connection_names: Array.isArray(data.connection_names) ? data.connection_names.filter(Boolean) : [],
        cable_color_pattern: Array.isArray(data.cable_color_pattern) ? data.cable_color_pattern.filter(Boolean) : [],
        storage_location: data.storage_type === 'location' ? data.storage_location?.trim() || undefined : undefined,
        // Image URL - only include if not empty
        ...(data.image_url?.trim() && { image_url: data.image_url.trim() }),
        // Storage type and container ID
        storage_type: data.storage_type || 'location',
        container_id: data.storage_type === 'container' ? data.container_id?.trim() || undefined : undefined,
      }
      
      // Debug logging
      if (import.meta.env.VITE_DEV_MODE === 'true') {
        console.log('Original form data:', data)
        console.log('Cleaned data for API:', cleanedData)
      }
      
      if (isEdit && itemId) {
        await updateItemMutation.mutateAsync({ id: itemId, data: cleanedData })
      } else {
        // For creation, only send non-undefined fields
        const createData = Object.fromEntries(
          Object.entries(cleanedData).filter(([_, value]) => value !== undefined)
        )
        
        await createItemMutation.mutateAsync(createData as Omit<Item, 'id' | 'created_at' | 'updated_at'>)
      }
      navigate('/items')
    } catch (error: any) {
      console.error('Form submission error:', error)
      
      let errorMessage = '保存に失敗しました。'
      
      if (error?.response?.status === 400) {
        errorMessage = 'リクエストデータに問題があります。入力内容を確認してください。'
        if (error.response?.data?.message) {
          errorMessage += ` (${error.response.data.message})`
        }
      } else if (error?.response?.status === 404) {
        errorMessage = '指定された備品が見つかりません。'
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

  // Loading state for edit mode
  if (isEdit && isLoadingItem) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spinner label="データを読み込み中..." />
      </div>
    )
  }

  // Error state for edit mode
  if (isEdit && itemError) {
    return (
      <div>
        <Button
          as={Link}
          to="/items"
          variant="light"
          startContent={<ArrowLeft size={20} />}
          className="mb-4"
        >
          一覧に戻る
        </Button>
        <Card>
          <CardBody>
            <p className="text-center text-danger">
              備品データの読み込みに失敗しました: {(itemError as any)?.message || '不明なエラー'}
            </p>
          </CardBody>
        </Card>
      </div>
    )
  }

  // Item not found for edit mode
  if (isEdit && !isLoadingItem && !item) {
    return (
      <div>
        <Button
          as={Link}
          to="/items"
          variant="light"
          startContent={<ArrowLeft size={20} />}
          className="mb-4"
        >
          一覧に戻る
        </Button>
        <Card>
          <CardBody>
            <p className="text-center text-warning">
              指定された備品が見つかりません
            </p>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button
          as={Link}
          to="/items"
          variant="light"
          startContent={<ArrowLeft size={20} />}
        >
          一覧に戻る
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold">
          {isEdit ? '備品編集' : '備品登録'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <h2 className="text-lg sm:text-xl font-semibold">基本情報</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                {...register('name', { required: '備品名は必須です' })}
                label="備品名"
                placeholder="例: ノートパソコン"
                errorMessage={errors.name?.message}
                isInvalid={!!errors.name}
                isRequired
                value={formValues.name || ''}
              />
              <Input
                {...register('label_id', { required: 'ラベルIDは必須です' })}
                label="ラベルID"
                placeholder="例: PC-001"
                errorMessage={errors.label_id?.message}
                isInvalid={!!errors.label_id}
                isRequired
                value={formValues.label_id || ''}
              />
              <Input
                {...register('model_number')}
                label="型番"
                placeholder="例: MacBook Pro 13inch"
                value={formValues.model_number || ''}
              />
              <Input
                {...register('purchase_year', { 
                  valueAsNumber: true,
                  setValueAs: (value) => value === '' ? undefined : Number(value)
                })}
                type="number"
                label="購入年"
                placeholder="例: 2023"
                value={formValues.purchase_year?.toString() || ''}
              />
              <Input
                {...register('purchase_amount', { 
                  valueAsNumber: true,
                  setValueAs: (value) => value === '' ? undefined : Number(value)
                })}
                type="number"
                label="購入金額"
                placeholder="例: 150000"
                startContent={<span className="text-default-400 text-sm">¥</span>}
                value={formValues.purchase_amount?.toString() || ''}
              />
              <Input
                {...register('durability_years', { 
                  valueAsNumber: true,
                  setValueAs: (value) => value === '' ? undefined : Number(value)
                })}
                type="number"
                label="耐用年数"
                placeholder="例: 5"
                endContent={<span className="text-default-400 text-sm">年</span>}
                value={formValues.durability_years?.toString() || ''}
              />
              <Select
                label="QRコードタイプ"
                placeholder="選択してください"
                selectionMode="single"
                selectedKeys={formValues.qr_code_type ? new Set([formValues.qr_code_type]) : new Set()}
                onSelectionChange={(keys) => {
                  const selectedKeys = Array.from(keys)
                  const value = selectedKeys[0] as 'qr' | 'barcode' | 'none'
                  setValue('qr_code_type', value)
                }}
              >
                <SelectItem key="none">なし</SelectItem>
                <SelectItem key="qr">QRコード</SelectItem>
                <SelectItem key="barcode">バーコード</SelectItem>
              </Select>
              <Controller
                name="storage_location"
                control={control}
                render={({ field }) => (
                  <SingleLocationInput
                    label={formValues.storage_type === 'container' ? "保管場所（自動設定）" : "保管場所"}
                    placeholder={formValues.storage_type === 'container' ? "コンテナ選択時に自動設定されます" : "例: A棟201教室、機材庫"}
                    value={field.value || ''}
                    onChange={field.onChange}
                    suggestions={locationSuggestions}
                    isReadOnly={formValues.storage_type === 'container'}
                    description={formValues.storage_type === 'container' ? "選択されたコンテナの場所が自動的に設定されます" : undefined}
                  />
                )}
              />
              
              {/* Storage Type Toggle */}
              <div className="sm:col-span-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">保管方法</label>
                  <Switch
                    isSelected={formValues.storage_type === 'container'}
                    onValueChange={(isSelected) => {
                      const value = isSelected ? 'container' : 'location'
                      setValue('storage_type', value)
                      // Reset container_id when switching to location storage
                      if (value === 'location') {
                        setValue('container_id', '')
                        // Clear auto-filled location when switching back to location storage
                        setValue('storage_location', '')
                      }
                    }}
                    color="primary"
                    size="sm"
                  >
                    <span className="text-sm">
                      {formValues.storage_type === 'container' ? 'コンテナに入っている' : '場所で保管'}
                    </span>
                  </Switch>
                </div>
              </div>
              
              {/* Container Selection - only show when storage_type is 'container' */}
              {formValues.storage_type === 'container' && (
                <div className="sm:col-span-2">
                  <Select
                    label="コンテナ"
                    placeholder="コンテナを選択"
                    selectionMode="single"
                    selectedKeys={formValues.container_id ? new Set([formValues.container_id]) : new Set()}
                    onSelectionChange={(keys) => {
                      const selectedKeys = Array.from(keys)
                      const value = selectedKeys[0] as string || ''
                      
                      if (import.meta.env.VITE_DEV_MODE === 'true') {
                        console.log('Container selection changed:', { keys, selectedKeys, value, containers })
                      }
                      
                      setValue('container_id', value)
                      
                      // コンテナ選択時に場所を自動設定
                      if (value) {
                        const selectedContainer = containers.find(c => c.id === value)
                        if (selectedContainer) {
                          setValue('storage_location', selectedContainer.location)
                          if (import.meta.env.VITE_DEV_MODE === 'true') {
                            console.log('Auto-setting location:', selectedContainer.location)
                          }
                        }
                      } else {
                        // コンテナが選択解除された場合は場所もクリア
                        setValue('storage_location', '')
                      }
                    }}
                    isRequired={formValues.storage_type === 'container'}
                  >
                    {containers.map((container) => (
                      <SelectItem
                        key={container.id}
                        textValue={`${container.name} (${container.id}) - ${container.location}`}
                      >
                        {container.name} ({container.id}) - {container.location}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              )}
              
              <div className="flex flex-col gap-4">
                <Controller
                  name="is_depreciation_target"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      isSelected={formValues.is_depreciation_target || false}
                      onValueChange={(value) => {
                        field.onChange(value)
                        setValue('is_depreciation_target', value)
                      }}
                    >
                      減価償却対象
                    </Switch>
                  )}
                />
                <Controller
                  name="is_disposed"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      isSelected={formValues.is_disposed || false}
                      onValueChange={(value) => {
                        field.onChange(value)
                        setValue('is_disposed', value)
                      }}
                    >
                      廃棄済み
                    </Switch>
                  )}
                />
              </div>
            </div>

            <div className="mt-4">
              <Textarea
                {...register('remarks')}
                label="備考"
                placeholder="備品に関する追加情報を入力してください"
                rows={4}
                value={formValues.remarks || ''}
              />
            </div>
          </CardBody>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-lg sm:text-xl font-semibold">接続・配線情報</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-6">
              <Controller
                name="connection_names"
                control={control}
                render={({ field }) => (
                  <ArrayInput
                    label="接続端子"
                    placeholder="例: HDMI、USB-C、電源"
                    values={formValues.connection_names || []}
                    onChange={(values) => {
                      field.onChange(values)
                      setValue('connection_names', values)
                    }}
                    maxItems={20}
                    suggestions={connectionSuggestions}
                  />
                )}
              />
              
              <Controller
                name="cable_color_pattern"
                control={control}
                render={({ field }) => (
                  <CableColorInput
                    label="ケーブル色パターン"
                    values={formValues.cable_color_pattern || []}
                    onChange={(values) => {
                      field.onChange(values)
                      setValue('cable_color_pattern', values)
                    }}
                    maxItems={10}
                    connectionNames={formValues.connection_names || []}
                    currentItemId={itemId}
                  />
                )}
              />
            </div>
          </CardBody>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-lg sm:text-xl font-semibold">画像</h2>
          </CardHeader>
          <CardBody>
            <Controller
              name="image_url"
              control={control}
              render={({ field }) => (
                <ImageUpload
                  currentImageUrl={formValues.image_url || undefined}
                  onImageChange={(imageUrl) => {
                    field.onChange(imageUrl || '')
                    setValue('image_url', imageUrl || '')
                  }}
                />
              )}
            />
          </CardBody>
        </Card>

        {(submitError || Object.keys(errors).length > 0) && (
          <Card className="mt-4">
            <CardBody>
              {submitError && (
                <Snippet color="danger" variant="flat" symbol="⚠️" className="mb-2">
                  {submitError}
                </Snippet>
              )}
              {Object.keys(errors).length > 0 && (
                <Snippet color="warning" variant="flat" symbol="⚠️">
                  入力に不備があります。必須項目を確認してください。
                </Snippet>
              )}
            </CardBody>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-6">
          <Button
            as={Link}
            to="/items"
            variant="flat"
            isDisabled={createItemMutation.isPending || updateItemMutation.isPending}
            size="sm"
            className="text-xs sm:text-sm order-2 sm:order-1"
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            color="primary"
            startContent={<Save size={16} />}
            isLoading={createItemMutation.isPending || updateItemMutation.isPending}
            size="sm"
            className="text-xs sm:text-sm order-1 sm:order-2"
          >
            {isEdit ? '更新' : '登録'}
          </Button>
        </div>
      </form>
    </div>
  )
}