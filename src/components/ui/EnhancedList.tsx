import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  SortDescriptor,
  Spinner,
  Selection,
} from '@heroui/react'
import React from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { CardView } from './CardView'
import { motion } from 'framer-motion'

// This will be expanded later
export interface ColumnDef<T> {
  key: keyof T | 'actions' | 'selector';
  label: string;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
}

interface EnhancedListProps<T extends { id: string }> {
  items: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
  renderCell: (item: T, columnKey: React.Key) => React.ReactNode;
  emptyContent?: React.ReactNode;
  selectionMode?: 'single' | 'multiple' | 'none';
  selectedKeys?: Selection;
  onSelectionChange?: (keys: Selection) => void;
  renderCard?: (item: T) => React.ReactNode;
}

export function EnhancedList<T extends { id: string }>({
  items,
  columns,
  isLoading,
  sortDescriptor,
  onSortChange,
  renderCell,
  emptyContent = "No items to display.",
  selectionMode = 'none',
  selectedKeys,
  onSelectionChange,
  renderCard,
}: EnhancedListProps<T>) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile && renderCard) {
    return (
      <CardView
        items={items}
        renderCard={renderCard}
        selectedKeys={selectedKeys || new Set()}
        onSelectionChange={onSelectionChange || (() => {})}
        isLoading={isLoading}
        emptyContent={emptyContent}
      />
    )
  }

  return (
    <Table
      aria-label="Enhanced List"
      removeWrapper
      sortDescriptor={sortDescriptor}
      onSortChange={onSortChange}
      selectionMode={selectionMode}
      selectedKeys={selectedKeys}
      onSelectionChange={onSelectionChange}
      selectionBehavior="toggle"
      classNames={{
        th: "sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 text-xs sm:text-sm",
        td: "text-xs sm:text-sm",
      }}
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={column.key as React.Key}
            align={column.align}
            allowsSorting={column.sortable}
          >
            {column.label}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody
        items={items}
        isLoading={isLoading}
        loadingContent={<Spinner label="Loading..." />}
        emptyContent={emptyContent}
      >
        {(item) => (
          <TableRow key={item.id}>
            {(columnKey) => (
              <TableCell>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderCell(item, columnKey)}
                </motion.div>
              </TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}