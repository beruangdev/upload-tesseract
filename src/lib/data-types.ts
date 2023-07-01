export interface ImageMetadataProps {
  size: number;
  created_at: string;
}

export interface ImageProps {
  id: number;
  filename: string;
  url: string;
  metadata: ImageMetadataProps;
  thumbnails: string[];
}

export interface PaginationProps {
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number;
}

export interface ImageDataResponseProps {
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number;
  data: ImageProps[];
}
