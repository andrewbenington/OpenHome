import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import appReducer from './slices/appSlice'
import resourcesSlice from './slices/resourcesSlice'

export const store = configureStore({
  reducer: {
    app: appReducer,
    resources: resourcesSlice,
  },
  middleware: getDefaultMiddleware({
    serializableCheck: false,
  }),
})

// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
