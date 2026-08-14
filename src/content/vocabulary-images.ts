import type { ImageSourcePropType } from 'react-native';
import type { VocabularyImageKey } from '@/models';

export const vocabularyImages: Record<VocabularyImageKey, ImageSourcePropType> = {
  hello: require('../../assets/images/vocabulary/hello.png'),
  water: require('../../assets/images/vocabulary/water.png'),
  book: require('../../assets/images/vocabulary/book.png'),
  sun: require('../../assets/images/vocabulary/sun.png'),
  cat: require('../../assets/images/vocabulary/cat.png'),
  house: require('../../assets/images/vocabulary/house.png'),
};
