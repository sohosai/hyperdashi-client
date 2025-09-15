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
  Spinner,
  Snippet,
} from '@heroui/react'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { ContainerWithItemCount } from '@/services'
import { useContainer, useCreateContainer, useUpdateContainer, useDeleteContainer, useContainers } from '@/hooks'
import { idCheckService, DuplicateItem } from '@/services'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { SingleLocationInput } from '@/components/ui/SingleLocationInput'

type ContainerFormData = Omit<ContainerWithItemCount, 'created_at' | 'updated_at' | 'item_count'> & {
  // Ensure shape matches useContainer(id) response
  // useContainer returns { container: Container }
}

export function ContainerForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const containerId = id || ''

  // useContainer returns { container: Container }
  // useContainer returns the Container directly (hook unwraps { container })
  const { data: container, isLoading: isLoadingContainer, error: containerError } = useContainer(containerId)
  
  const createContainerMutation = useCreateContainer()
  const updateContainerMutation = useUpdateContainer()
  const deleteContainerMutation = useDeleteContainer()

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isDuplicateId, setIsDuplicateId] = useState(false)
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false)
  const [duplicateItems, setDuplicateItems] = useState<DuplicateItem[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<ContainerFormData>({
    defaultValues: {
      id: '',
      name: '',
      description: '',
      location: '',
      is_disposed: false,
      image_url: '',
    },
  })

  const formValues = watch()
  // const [uploading, setUploading] = useState(false)
  // const [uploadProgress, setUploadProgress] = useState<number>(0)

  // Get location suggestions from all containers
  const { data: allContainersData } = useContainers()
  const locationSuggestions = Array.from(
    new Set((allContainersData?.containers || []).map((c: any) => c.location).filter(Boolean))
  )

  // リアルタイム重複チェック
  useEffect(() => {
    const checkDuplicate = async () => {
      if (!formValues.id?.trim()) {
        setIsDuplicateId(false)
        setIsCheckingDuplicate(false)
        setDuplicateItems([])
        return
      }
      
      // 編集時で元のIDと同じ場合はチェックしない
      if (isEdit && container && formValues.id === container.id) {
        setIsDuplicateId(false)
        setIsCheckingDuplicate(false)
        setDuplicateItems([])
        return
      }
      
      setIsCheckingDuplicate(true)
      
      try {
        const response = await idCheckService.checkGlobalId(formValues.id)
        setIsDuplicateId(response.exists)
        setDuplicateItems(response.duplicates)
      } catch (error) {
        console.error('ID重複チェックエラー:', error)
        setIsDuplicateId(false)
        setDuplicateItems([])
      } finally {
        setIsCheckingDuplicate(false)
      }
    }
    
    const timeoutId = setTimeout(checkDuplicate, 300) // 300ms のデバウンス
    return () => clearTimeout(timeoutId)
  }, [formValues.id, isEdit, container])

  // 重複メッセージを生成
  const getDuplicateMessage = () => {
    if (!isDuplicateId || duplicateItems.length === 0) return undefined
    
    const itemNames = duplicateItems.map(item => {
      const typeLabel = item.item_type === 'container' ? 'コンテナ' : '備品'
      return `${typeLabel}: ${item.name}`
    })
    
    return `このIDは既に使用されています - ${itemNames.join(', ')}`
  }

  useEffect(() => {
    if (isEdit && container) {
      // Ensure values are pushed into RHF when data arrives
      setValue('id', container.id || '')
      setValue('name', container.name || '')
      setValue('description', container.description || '')
      setValue('location', container.location || '')
      setValue('is_disposed', !!container.is_disposed)
    }
  }, [container, isEdit, setValue])

  const onSubmit = async (data: ContainerFormData) => {
    try {
      setSubmitError(null)
      
      if (isEdit && containerId) {
        // 編集時はidを含めない（URLパラメータで指定済み）
        const updateData = {
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          location: data.location.trim(),
          image_url: data.image_url?.trim() ? data.image_url.trim() : undefined,
          is_disposed: data.is_disposed,
        }
        await updateContainerMutation.mutateAsync({ id: containerId, data: updateData })
      } else {
        // 新規作成時は必ず手動IDを利用
        const createData = {
          id: data.id.trim(),
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          location: data.location.trim(),
          image_url: data.image_url?.trim() ? data.image_url.trim() : undefined,
        }
        await createContainerMutation.mutateAsync(createData)
      }
      navigate('/containers')
    } catch (error: any) {
      setSubmitError(error.message || '保存に失敗しました。')
    }
  }

  const handleDelete = async () => {
    if (!containerId) return
    // item_count is not available from getContainer response; prevent delete via server-side validation only
    if (confirm(`コンテナ「${container?.name || containerId}」を本当に削除しますか？`)) {
      try {
        await deleteContainerMutation.mutateAsync(containerId)
        navigate('/containers')
      } catch (error: any) {
        setSubmitError(error.message || '削除に失敗しました。')
      }
    }
  }

  if (isEdit && isLoadingContainer) {
    return <Spinner label="読み込み中..." />
  }

  if (isEdit && containerError) {
    return <div>エラー: {containerError.message}</div>
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button as={Link} to="/containers" variant="light" startContent={<ArrowLeft size={20} />}>
          一覧に戻る
        </Button>
        <h1 className="text-2xl font-bold">{isEdit ? 'コンテナ編集' : 'コンテナ作成'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">コンテナ情報</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              {...register('id', { required: 'ラベルIDは必須です' })}
              label="ラベルID"
              placeholder="例: C001"
              errorMessage={errors.id?.message || getDuplicateMessage()}
              isInvalid={!!errors.id || isDuplicateId}
              color={isDuplicateId && !errors.id ? 'danger' : 'default'}
              value={formValues.id || ''}
              isReadOnly={isEdit}
              isRequired
            />
            <Input
              {...register('name', { required: 'コンテナ名は必須です' })}
              label="コンテナ名"
              isInvalid={!!errors.name}
              errorMessage={errors.name?.message}
              isRequired
              value={formValues.name || ''}
            />
            <Controller
              name="location"
              control={control}
              rules={{ required: '場所は必須です' }}
              render={({ field, fieldState }) => (
                <SingleLocationInput
                  label="場所"
                  placeholder="場所を入力または選択"
                  value={field.value || ''}
                  onChange={field.onChange}
                  suggestions={locationSuggestions}
                  isInvalid={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                  isRequired
                />
              )}
            />
            <Textarea
              {...register('description')}
              label="説明"
              value={formValues.description || ''}
            />
            <Switch
              isSelected={!!formValues.is_disposed}
              onValueChange={(v) => setValue('is_disposed', v)}
            >
              廃棄済み
            </Switch>

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

        {submitError && (
          <Card className="mt-4">
            <CardBody>
              <Snippet color="danger" variant="flat">{submitError}</Snippet>
            </CardBody>
          </Card>
        )}

        <div className="flex justify-between items-center mt-6">
          {isEdit && (
            <Button
              color="danger"
              variant="light"
              onPress={handleDelete}
              startContent={<Trash2 size={16} />}
              isLoading={deleteContainerMutation.isPending}
            >
              削除
            </Button>
          )}
          <div className="flex gap-2">
            <Button as={Link} to="/containers" variant="flat">
              キャンセル
            </Button>
            <Button
              type="submit"
              color="primary"
              isLoading={createContainerMutation.isPending || updateContainerMutation.isPending}
              startContent={<Save size={16} />}
              isDisabled={!formValues.id?.trim() || !formValues.name?.trim() || !formValues.location?.trim() || isCheckingDuplicate || isDuplicateId}
            >
              {isEdit ? '更新' : '作成'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
