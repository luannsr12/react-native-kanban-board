import React from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  StyleSheet,
  Text,
  View,
  Dimensions,
  TextStyle,
  ViewStyle,
  Platform,
  StatusBar
} from 'react-native';
import EmptyColumn from './empty-column.component';
import { ColumnModel } from '../../models/column-model';
import { CardModel } from '../../models/card-model';
import { Badge } from './badge.component';
import { BoardTools } from '../../utils/board-tools';
import { BoardState } from '../../models/board-state';
import { COLUMN_MARGIN } from '../../board-consts';
import { KanbanContext } from '../kanban-context.provider';

export type ColumnExternalProps = {
  /**
   * Function that renders the content for an empty column.
   * @param {ColumnModel} item - The column model representing the empty column.
   * @returns {JSX.Element} - The JSX element representing the content for the empty column.
   */
  renderEmptyColumn?: (item: ColumnModel) => JSX.Element;

  /**
   * Custom style for the column header container.
   */
  columnHeaderContainerStyle?: StyleProp<ViewStyle>;

  /**
   * Custom style for the column header title text.
   */
  columnHeaderTitleStyle?: StyleProp<TextStyle>;

  columnHeight?: number;

  /**
   * Custom render Header
   */
  renderColumnHeader?: (item: ColumnModel) => JSX.Element | null;

  /**
   * Custom render footer
   */
  renderColumnFooter?: (item: ColumnModel) => JSX.Element;

}

type Props = KanbanContext &
  ColumnExternalProps & {
    boardState: BoardState;
    column: ColumnModel;
    renderCardItem: (item: CardModel) => JSX.Element;
    isWithCountBadge: boolean;
    movingMode: boolean;
    singleDataColumnAvailable: boolean;
    columnHeight?: number;
  };

type State = {
  availableHeight: any,
}

const screenHeight = Dimensions.get('window').height;
const topInset = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 40;
const bottomInset = Platform.OS === 'android' ? 250 : 170;

const COLUMN_MAX_HEIGHT = screenHeight - topInset - bottomInset;

export class Column extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      availableHeight: 0,
    };
  }

  scrollingDown: boolean = false;
  flatList: React.RefObject<FlatList<CardModel>> = React.createRef<FlatList<CardModel>>();
  viewabilityConfig: any = {
    itemVisiblePercentThreshold: 1,
    waitForInteraction: false
  };

  setRefColumn = (ref: View | null) => {
    this.props.column.setRef(ref);
  }

  measureColumn = () => {
    this.props.column.measure();
  }

  scrollToOffset = (offset: number) => {
    this.flatList?.current?.scrollToOffset({ animated: true, offset });
  }

  handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {
      column
    } = this.props;

    const liveOffset = event.nativeEvent.contentOffset.y;
    this.scrollingDown = liveOffset > column.scrollOffset;
  }

  endScrolling = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {
      column
    } = this.props;

    const currentOffset = event.nativeEvent.contentOffset.y;
    const scrollingDownEnded = this.scrollingDown && currentOffset >= column.scrollOffset;
    const scrollingUpEnded = !this.scrollingDown && currentOffset <= column.scrollOffset;

    if (scrollingDownEnded || scrollingUpEnded) {
      column.setScrollOffset(currentOffset);
      BoardTools.validateAndMeasureBoard(this.props.boardState);
    }
  }

  onScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    this.endScrolling(event);
  }

  onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    this.endScrolling(event);
  }

  onContentSizeChange = (_: number, contentHeight: number) => {
    const { column } = this.props;
    column.setContentHeight(contentHeight);
  }

  handleChangeVisibleItems = () => {
    const { column } = this.props;
    BoardTools.validateAndMeasureBoard(this.props.boardState, column);
  }

  render = () => {
    const {
      column,
      renderCardItem,
      isWithCountBadge,
      singleDataColumnAvailable,
      movingMode,
      boardState,
      oneColumnWidth,
      columnWidth,
      columnHeight,
      renderEmptyColumn,
      columnHeaderContainerStyle,
      columnHeaderTitleStyle,
      renderColumnHeader,
      renderColumnFooter,
    } = this.props;

    const items = boardState.columnCardsMap.has(column.id) ? boardState.columnCardsMap.get(column.id)! : [];
    const noOfItems = items.length;

    let columnContent;
    if (noOfItems > 0) {
      columnContent = (
        <FlatList
          style={{ marginBottom: 30 }} 
          data={items}
          ref={this.flatList}
          onScroll={this.handleScroll}
          scrollEventThrottle={0}
          onMomentumScrollEnd={this.onMomentumScrollEnd}
          onScrollEndDrag={this.onScrollEndDrag}
          onViewableItemsChanged={this.handleChangeVisibleItems}
          viewabilityConfig={this.viewabilityConfig}
          renderItem={item => (
            <View key={item.item.id}
              ref={ref => item.item.setRef(ref)}
              onLayout={() => item.item.validateAndMeasure()}>
              {renderCardItem(item.item)}
            </View>
          )}
          keyExtractor={item => item.id ?? ''}
          scrollEnabled={!movingMode}
          onContentSizeChange={this.onContentSizeChange}
          showsVerticalScrollIndicator={false}
        />
      );
    } else {
      columnContent = renderEmptyColumn ?
        renderEmptyColumn(column) : (
          <EmptyColumn />
        );
    }

    const customHeader = renderColumnHeader?.(column);
    this.state = { availableHeight: 0 };

    const FOOTER_SPACE = 60;
    const columnMaxHeight = this.state.availableHeight > 0
      ? this.state.availableHeight - FOOTER_SPACE
      : 500; // valor fallback

    return (
      <View style={{height:'95%'}}>
        <View
          ref={this.setRefColumn}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            this.setState({ availableHeight: height });
            this.measureColumn();
          }}
          style={[
            styles.columnContainer, {
              width: singleDataColumnAvailable ? oneColumnWidth : columnWidth,
              maxHeight: '100%',
              marginRight: singleDataColumnAvailable ? 0 : COLUMN_MARGIN,
              marginBottom: 0,
            }]}>

          {customHeader
            ? customHeader
            : (
              <View style={[styles.columnHeaderContainer, columnHeaderContainerStyle]}>
                <Text style={[styles.columnHeaderTitle, columnHeaderTitleStyle]}>
                  {column.title}
                </Text>
                {isWithCountBadge && (
                  <View style={styles.columnHeaderRightContainer}>
                    <Badge value={noOfItems} />
                  </View>
                )}
              </View>
            )}
          <>
            {columnContent}
          </>
        </View>
        <View style={{ marginTop: 0, position: 'relative',  width: '100%' }}>
          {renderColumnFooter?.(column)}
        </View>
      </View>
    );
  }
}

export default Column;

const styles = StyleSheet.create({
  columnContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
  },
  columnHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  columnHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  columnHeaderRightContainer: {
  },
});
