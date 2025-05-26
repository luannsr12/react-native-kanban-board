import React, { Component } from 'react'
import {
  TouchableOpacity,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle
} from 'react-native';

import { CardModel } from '../../models/card-model';
import { Tags } from './tags.component';
import { KanbanContext, withKanbanContext } from '../kanban-context.provider';
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';
export type CardExternalProps = {
  /**
   * Callback function invoked when the card is pressed.
   * @param {CardModel} model - The card model representing the pressed card.
   */
  onCardPress?: (model: CardModel) => void;

  /**
   * Function that renders the content of the card.
   * @param {CardModel} model - The card model to render the content for.
   * @returns {JSX.Element | null} - The JSX element representing the card content, or null to render the default content.
   */
  renderCardContent?(model: CardModel): JSX.Element | null;

  isDropSlot?: boolean;

  disableDrag?: boolean;

  /**
   * Custom style for the card container.
   */
  cardContainerStyle?: StyleProp<ViewStyle>;

  /**
   * Custom style for the card title text.
   */
  cardTitleTextStyle?: StyleProp<TextStyle>;

  /**
   * Custom style for the card subtitle text.
   */
  cardSubtitleTextStyle?: StyleProp<TextStyle>;

  /**
   * Custom style for the card content text.
   */
  cardContentTextStyle?: StyleProp<TextStyle>;
}

type Props = CardExternalProps &
  KanbanContext & {
    model: CardModel;
    hidden: boolean;
    onLongPress?: (model: any) => void;
  };

class Card extends Component<Props> {
  onPress = () => {
    const {
      onCardPress,
      model
    } = this.props;

    if (!onCardPress) {
      return;
    }

    onCardPress(model);
  }

  render() {
    const {
      model,
      hidden,
      renderCardContent,
      cardContainerStyle,
      cardTitleTextStyle,
      cardSubtitleTextStyle,
      cardContentTextStyle,
      isDropSlot,
      disableDrag
    } = this.props;

    return (
      <LongPressGestureHandler
        minDurationMs={600}
        enabled={!disableDrag}
        onHandlerStateChange={(event) => {
          if (event.nativeEvent.state === State.ACTIVE) {
            this.props.onLongPress?.(this.props.model);
          }
        }}
      >
        <View
          style={[
            styles.container,
            cardContainerStyle,
            hidden && { opacity: 0 },
            isDropSlot && styles.dropSlot
          ]}
        >
          <TouchableOpacity onPress={this.onPress} disabled={this.props.isDropSlot}>
            {this.props.isDropSlot ? (
              // Slot vazio visual
              <View style={styles.slotPlaceholder} />
            ) : renderCardContent ? (
              renderCardContent(model)
            ) : (
              <React.Fragment>
                <View style={styles.cardHeaderContainer}>
                  <View style={styles.cardTitleContainer}>
                    <Text style={[cardTitleTextStyle, styles.cardTitleText]}>{model.title}</Text>
                  </View>
                  <Text style={[cardSubtitleTextStyle, styles.cardSubtitleText]}>{model.subtitle}</Text>
                </View>
                <View style={styles.cardContentContainer}>
                  <Text style={[cardContentTextStyle, styles.cardContentText]}>{model.description}</Text>
                </View>
                {model.tags && model.tags.length > 0 && (
                  <Tags items={model.tags} />
                )}
              </React.Fragment>
            )}
          </TouchableOpacity>
        </View>
      </LongPressGestureHandler>
    )
  }
}

export default withKanbanContext(Card);

const styles = StyleSheet.create({
  dropSlot: {
    opacity: 1,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#007bff',
    backgroundColor: '#e6f0ff',
  },
  slotPlaceholder: {
    height: 60,
    borderRadius: 6,
    backgroundColor: '#e6f0ff',
  },
  container: {
    borderColor: '#E3E3E3',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    elevation: 3
  },
  cardHeaderContainer: {
    marginBottom: 16
  },
  cardTitleContainer: {
    marginBottom: 8
  },
  cardTitleText: {
    fontWeight: 'bold',
  },
  cardSubtitleText: {
  },
  cardContentContainer: {
    marginBottom: 16
  },
  cardContentText: {
    fontWeight: 'bold'
  }
});
