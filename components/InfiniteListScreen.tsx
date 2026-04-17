import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
  FlatListProps,
  ListRenderItem,
  ListRenderItemInfo,
} from "react-native";
import { useAppTheme } from "@/utils/useAppTheme";

interface InfiniteListData {
  id: string;
  [key: string]: any;
}

interface InfiniteListScreenProps<T extends InfiniteListData> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement | null;
  keyExtractor?: (item: T) => string;
  onLoadMore?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
  hasMore?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  headerComponent?: React.ReactElement | null;
  footerComponent?: React.ReactElement | null;
  numColumns?: number;
  estimatedItemSize?: number;
  contentContainerStyle?: any;
}

export function InfiniteListScreen<T extends InfiniteListData>({
  data,
  renderItem,
  keyExtractor = (item) => item.id,
  onLoadMore,
  onRefresh,
  isLoading = false,
  isRefreshing = false,
  hasMore = true,
  emptyMessage = "Nenhum item encontrado",
  loadingMessage = "Carregando...",
  headerComponent,
  footerComponent,
  numColumns = 1,
  estimatedItemSize = 100,
  contentContainerStyle,
}: InfiniteListScreenProps<T>) {
  const { colors } = useAppTheme();
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const onChange = () => {
      setDimensions(Dimensions.get("window"));
    };

    const subscription = Dimensions.addEventListener("change", onChange);
    return () => subscription?.remove();
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore && onLoadMore) {
      onLoadMore();
    }
  }, [isLoading, hasMore, onLoadMore]);

  const renderFooter = (): React.ReactElement | null => {
    if (isLoading) {
      return (
        <View style={[styles.loadingFooter, { backgroundColor: colors.bg }]}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={[styles.loadingText, { color: colors.textSubtle }]}>
            {loadingMessage}
          </Text>
        </View>
      );
    }
    return null;
  };

  const renderEmpty = (): React.ReactElement => (
    <View style={[styles.emptyContainer, { backgroundColor: colors.bg }]}>
      <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
        {emptyMessage}
      </Text>
    </View>
  );

  const getItemLayout =
    Platform.OS === "ios"
      ? (data: any, index: number) => ({
          length: estimatedItemSize,
          offset: estimatedItemSize * index,
          index,
        })
      : undefined;

  const getNumColumns = () => {
    if (dimensions.width >= 768) {
      return Math.min(numColumns * 2, 4);
    }
    return numColumns;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={({ item, index }: ListRenderItemInfo<T>) =>
          renderItem(item, index)
        }
        keyExtractor={keyExtractor}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined
        }
        ListHeaderComponent={headerComponent}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        getItemLayout={getItemLayout}
        numColumns={getNumColumns()}
        contentContainerStyle={[
          styles.contentContainer,
          contentContainerStyle,
          { backgroundColor: colors.bg },
        ]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
      />
      {footerComponent && <View>{footerComponent}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default InfiniteListScreen;
