import { useRef, useCallback } from 'react';
import { DndProvider, useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { XYCoord } from 'dnd-core';

type Props = {
  columns: ItemType[];
  onSwap: (a: number, b: number) => void;
};

type ItemType = {
  width: number;
  draggable: boolean;
  item: React.ReactNode;
  id: any;
};

export const SortableHeading: React.FC<Props> = ({ columns, onSwap }) => {
  const moveCard = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      onSwap(dragIndex, hoverIndex);
    },
    [onSwap]
  );

  let index = 0;
  return (
    <DndProvider backend={HTML5Backend}>
      {columns.map((item) =>
        item.draggable ? (
          <Item key={item.id} item={item} index={index++} moveCard={moveCard} />
        ) : (
          <div
            key={item.id}
            style={{
              flexBasis: item.width || 0,
            }}
          >
            {item.item}
          </div>
        )
      )}
    </DndProvider>
  );
};

type ItemProps = {
  item: ItemType;
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
};

const Item: React.FC<ItemProps> = ({ item, index, moveCard }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ handlerId }, drop] = useDrop({
    accept: 'card',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: any, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const itemWidth = hoverBoundingRect.right - hoverBoundingRect.left;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the left
      const hoverClientX = (clientOffset as XYCoord).x - hoverBoundingRect.left;

      // Dragging right
      if (dragIndex < hoverIndex && hoverClientX < 5) {
        return;
      }

      // Dragging left
      if (dragIndex > hoverIndex && hoverClientX > itemWidth - 5) {
        return;
      }

      // Time to actually perform the action
      moveCard(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'card',
    item: () => {
      return { id: item.id, index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.3 : 1;
  drag(drop(ref));

  return (
    <div
      style={{
        flexBasis: item.width || 0,
        position: 'relative',
        opacity,
      }}
      ref={ref}
      data-handler-id={handlerId}
    >
      {item.item}
    </div>
  );
};