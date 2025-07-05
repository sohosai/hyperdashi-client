# 備品編集フォーム修正完了

## 修正内容

### 問題
備品編集フォームで既存のデータが表示されない問題

### 原因
React Hook FormとHeroUIコンポーネントの組み合わせで、`reset()`が正しく動作しない

### 解決策

1. **`reset()`の代わりに`setValue()`を使用**
   - 各フィールドに個別に値を設定
   - より確実なフォーム値の反映

2. **明示的な`value`プロパティの設定**
   - HeroUIコンポーネントに`value`を明示的に渡す
   - `watch()`で取得した現在の値を使用

3. **Controller使用時の改善**
   - Switch、Selectコンポーネントで明示的な値設定
   - onChange時に`setValue()`も同時実行

### 実装した変更

1. **フォーム値設定**:
   ```typescript
   setValue('name', item.name || '')
   setValue('label_id', item.label_id || '')
   // すべてのフィールドに個別設定
   ```

2. **明示的value設定**:
   ```tsx
   <Input
     {...register('name')}
     value={formValues.name || ''}
   />
   ```

3. **ControllerでのSwitch/Select**:
   ```tsx
   <Switch
     isSelected={formValues.is_disposed || false}
     onValueChange={(value) => {
       field.onChange(value)
       setValue('is_disposed', value)
     }}
   />
   ```

## テスト方法

1. **開発サーバー起動**: `npm run dev`
2. **備品一覧アクセス**: http://localhost:5174/items
3. **編集テスト**: 既存備品の「編集」ボタンをクリック
4. **確認**: 全フィールドに既存データが表示される

## デバッグ情報

開発モードでコンソールに以下が出力されます：
- `ItemForm Debug: { ... }` - API取得状況
- `Form values: { ... }` - 現在のフォーム値
- `Setting form values with item data: { ... }` - 値設定処理

フォーム編集機能が正常に動作するはずです！