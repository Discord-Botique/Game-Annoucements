export interface BlogItem {
  shareImage: string;
  title: string;
  _id: string;
  slug: string;
  date: string;
}

export type PostsResponse = {
  blogList: BlogItem[];
};
