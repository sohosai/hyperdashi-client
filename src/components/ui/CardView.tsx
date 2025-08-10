import React from 'react';
import { Card, CardBody, Checkbox } from '@heroui/react';
import { Selection } from '@heroui/react';
import { motion } from 'framer-motion';

interface CardViewProps<T extends { id: string }> {
  items: T[];
  renderCard: (item: T) => React.ReactNode;
  selectedKeys: Selection;
  onSelectionChange: (keys: Selection) => void;
  isLoading?: boolean;
  emptyContent?: React.ReactNode;
}

export function CardView<T extends { id: string }>({
  items,
  renderCard,
  selectedKeys,
  onSelectionChange,
  isLoading,
  emptyContent = "No items to display.",
}: CardViewProps<T>) {
  const handleSelectionChange = (item: T, isSelected: boolean) => {
    const newSelection = new Set(selectedKeys === 'all' ? items.map(i => i.id) : selectedKeys);
    if (isSelected) {
      newSelection.add(item.id);
    } else {
      newSelection.delete(item.id);
    }
    onSelectionChange(newSelection);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (items.length === 0) {
    return <div className="text-center p-4">{emptyContent}</div>;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item) => (
        <motion.div key={item.id} variants={itemVariants}>
          <Card shadow="sm">
            <CardBody className="p-4">
              <div className="flex items-start gap-4">
                <Checkbox
                  isSelected={selectedKeys === 'all' || selectedKeys.has(item.id)}
                  onValueChange={(isSelected) => handleSelectionChange(item, isSelected)}
                  aria-label={`Select item ${item.id}`}
                />
                <div className="flex-grow">
                  {renderCard(item)}
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}