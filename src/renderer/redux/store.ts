import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';
import recentSavesReducer from './slices/recentSavesSlice';
import resourcesSlice from './slices/resourcesSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    recentSaves: recentSavesReducer,
    resources: resourcesSlice
  },
  middleware: getDefaultMiddleware({
    serializableCheck: false,
  }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
