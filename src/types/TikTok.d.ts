interface TikTokUserInfo {
  id: string;
  uniqueId: string;
  nickname: string;
  avatarThumb: string;
  avatarMedium: string;
  avatarLarger: string;
  signature: string;
  verified: boolean;
  secUid: string;
  secret: boolean;
  ftc: boolean;
  relation: number;
  openFavorite: boolean;
  commentSetting: number;
  duetSetting: number;
  stitchSetting: number;
  privateAccount: boolean;
  isADVirtual: boolean;
  isUnderAge18: boolean;
  uniqueIdModifyTime: number;
  ttSeller: boolean;
}

interface TikTokUserStats {
  followingCount: number;
  followerCount: number;
  heartCount: number;
  videoCount: number;
  diggCount: number;
  heart: number;
}

export interface TikTokUser {
  user?: TikTokUserInfo;
  stats?: TikTokUserStats;
}

interface TikTokFeedItemInfo {
  id: string;
  text: string;
  stitchEnabled: boolean;
  shareEnabled: boolean;
  createTime: string;
  authorId: string;
  musicId: string;
  covers: string[];
  coversOrigin: string[];
  shareCover: string[];
  coversDynamic: string[];
  video: {
    urls: string[];
    videoMeta: {
      width: number;
      height: number;
      ratio: number;
      duration: number;
    };
  };
  diggCount: number;
  shareCount: number;
  playCount: number;
  commentCount: number;
  isOriginal: boolean;
  isOfficial: boolean;
  isActivityItem: boolean;
  secret: boolean;
  forFriend: boolean;
  vl1: boolean;
  warnInfo: unknown[];
  liked: boolean;
  commentStatus: number;
  showNotPass: boolean;
  isAd: boolean;
  itemMute: boolean;
}

interface TikTokFeedItemAuthor {
  secUid: string;
  userId: string;
  nickName: string;
  signature: string;
  verified: boolean;
  covers: string[];
  coversMedium: string[];
  coversLarger: string[];
  isSecret: boolean;
  secret: boolean;
  relation: number;
  roomId: string;
}

interface TikTokFeedItemMusic {
  musicId: string;
  musicName: string;
  authorName: string;
  original: boolean;
  playUrl: string[];
  covers: string[];
  coversMedium: string[];
  coversLarger: string[];
}

interface TikTokFeedItemChallenge {
  challengeId: string;
  challengeName: string;
  isCommerce: boolean;
  text: string;
  covers: string[];
  coversMedium: string[];
  coversLarger: string[];
  splitTitle: string;
}

interface TikTokFeedItemTextExtra {
  AwemeId: string;
  Start: number;
  End: number;
  HashtagName: string;
  HashtagId: string;
  Type: number;
  UserId: string;
  IsCommerce: boolean;
  UserUniqueId: string;
  SecUid: string;
  SubType: number;
}

export interface TikTokSticker {
  stickerType: number;
  stickerText: string[];
}

export interface TikTokFeedItem {
  itemInfos: TikTokFeedItemInfo;
  authorInfos: TikTokFeedItemAuthor;
  musicInfos: TikTokFeedItemMusic;
  /**
   * A.K.A hashtag
   */
  challengeInfoList: TikTokFeedItemChallenge[];
  duetInfo: string;
  textExtra: TikTokFeedItemTextExtra[];
  stickerTextList: TikTokSticker[];
}
