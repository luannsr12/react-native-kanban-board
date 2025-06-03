import React, { Component, RefObject } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';

import { COLUMN_MARGIN } from '../../board-consts';
import { Dot } from './dot.component';
import { KanbanContext } from '../kanban-context.provider';
import { ColumnModel } from '../../models/column-model';

const INITIAL_ACTIVE_ITEM = 0;

type Props = KanbanContext & {
  data: ColumnModel[];
  itemWidth: number;
  onScrollEndDrag: () => void;
  renderItem: (item: ColumnModel, singleDataColumnAvailable: boolean) => JSX.Element;
  sliderWidth: number;
  scrollEnabled: boolean;
  onActiveIndexChange?: (index: number) => void;
  renderColumnFooter?: (item: ColumnModel) => JSX.Element;
};

type State = {
  oneColumnActiveItemIndex: number;
  scrollOffsetX: number;
};

export class ColumnSnapContainer extends Component<Props, State> {
  carouselRef: RefObject<ScrollView> = React.createRef<ScrollView>();

  constructor(props: Props) {
    super(props);

    this.state = {
      oneColumnActiveItemIndex: INITIAL_ACTIVE_ITEM,
      scrollOffsetX: 0
    };
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.displayedColumns === 1 &&
      (prevProps.itemWidth !== this.props.itemWidth || prevProps.sliderWidth !== this.props.sliderWidth)) {
      this.scrollToItem(this.state.oneColumnActiveItemIndex);
    }
  }

  onScrollEndDrag = () => {
    const { onScrollEndDrag } = this.props;
    onScrollEndDrag && onScrollEndDrag();
  };

  onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    this.onScrollEnd(event.nativeEvent.contentOffset.x);
  };

  onScrollEnd = (offsetX: number) => {
    const { itemWidth } = this.props;

    const activeItemIndex = Math.round(offsetX / itemWidth);
    this.setState({
      oneColumnActiveItemIndex: activeItemIndex,
      scrollOffsetX: offsetX
    });
    this.props.onActiveIndexChange?.(activeItemIndex);
    this.onScrollEndDrag();
  }

  snapToPrev = () => {
    const { itemWidth } = this.props;
    const { scrollOffsetX } = this.state;

    if (scrollOffsetX <= 0) {
      return;
    }

    const prevOffset = Math.max(0, scrollOffsetX - itemWidth - COLUMN_MARGIN);
    this.scrollToOffset(prevOffset);
  };

  snapToNext = () => {
    const { data, itemWidth } = this.props;
    const { scrollOffsetX } = this.state;

    const maxScrollOffsetX = (data.length - 1) * (itemWidth + COLUMN_MARGIN);
    const nextOffset = Math.min(maxScrollOffsetX, scrollOffsetX + itemWidth + COLUMN_MARGIN);

    this.scrollToOffset(nextOffset);
  };

  scrollToItem(index: number) {
    const { itemWidth } = this.props;
    const offsetX = index * itemWidth;
    this.carouselRef.current?.scrollTo({ x: offsetX, y: 0, animated: true });

    if (Platform.OS === 'android') {
      this.onScrollEnd(offsetX); // BUG on Android: onMomentumScrollEnd won't be invoked if scrolled programmatically
    }
  }

  scrollToOffset(offsetX: number) {
    offsetX = Math.round(offsetX);
    this.carouselRef.current?.scrollTo({ x: offsetX, y: 0, animated: true });

    if (Platform.OS === 'android') {
      this.onScrollEnd(offsetX); // BUG on Android: onMomentumScrollEnd won't be invoked if scrolled programmatically
    }
  }

  render() {
    const { data, displayedColumns, scrollEnabled, sliderWidth } = this.props;
    const { oneColumnActiveItemIndex } = this.state;
    console.log(data);
    const singleColumnDisplay = displayedColumns === 1;
    const singleDataColumnAvailable = data.length === 1;

    return (
      <View style={styles.container}>
        <ScrollView
          ref={this.carouselRef}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          overScrollMode="never"
          automaticallyAdjustContentInsets={false}
          directionalLockEnabled={true}
          pinchGestureEnabled={false}
          scrollsToTop={false}
          renderToHardwareTextureAndroid={true}
          scrollEnabled={scrollEnabled}
          style={[styles.scrollContainer, { width: sliderWidth }]}
          contentContainerStyle={[styles.contentContainer, { paddingLeft: COLUMN_MARGIN, paddingBottom: Platform.OS === 'ios' ? 34 + 16 : 16 }]}
          horizontal={true}
          scrollEventThrottle={16}
          snapToInterval={(singleDataColumnAvailable ? this.props.oneColumnWidth : this.props.itemWidth) + COLUMN_MARGIN}
          onMomentumScrollEnd={this.onMomentumScrollEnd}>
          {data.map((item, index) => (
              <View
                key={`carousel-item-${index}`}
                style={{
                  width: singleDataColumnAvailable ? this.props.oneColumnWidth : this.props.itemWidth,
                  paddingBottom: 0,
                  marginRight: COLUMN_MARGIN,
                  maxHeight: '100%',
                }}>
                {this.props.renderItem(item, singleDataColumnAvailable)}
              </View>
          ))}


        </ScrollView>
 

        {singleColumnDisplay &&
          <View style={styles.positionIndicatorContainer}>
            {data.map((_, index) => (
              <Dot
                key={`carousel-pos-indicator-${index}`}
                color={oneColumnActiveItemIndex === index ? '#000000' : '#DDDDDD'}
                style={styles.positionIndicator}
              />
            ))}
          </View>}
      </View>
    );
  }
}

export default ColumnSnapContainer;

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  scrollContainer: {
    flexDirection: 'row',
    height: '100%',
    paddingBottom:50,
  },
  contentContainer: {
    paddingVertical: 8,
  },
  positionIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    
  },
  positionIndicator: {
    marginHorizontal: 5,
  },
});
