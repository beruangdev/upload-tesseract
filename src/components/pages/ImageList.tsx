"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createWorker } from "tesseract.js";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "../ui/dialog";
import { Progress } from "../ui/progress";
import { Textarea } from "../ui/textarea";
import Image from "next/image";
import { ImageDataResponseProps, ImageProps } from "@/lib/data-types";
import useSWR from "swr";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const imageDefault = {
  id: 0,
  filename: "",
  url: "",
  metadata: {
    size: 0,
    created_at: "",
  },
  thumbnails: [],
};

export default function ImageList() {
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageText, setImageText] = useState<string>("");
  const [activeImage, setActiveImage] = useState<ImageProps>(imageDefault);
  const [progressOcr, setProgressOcr] = useState(0);
  const [worker, setWorker] = useState<any>(null); // Worker untuk Tesseract.js
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("An error occurred while fetching the data.");
    }
    const data = await response.json();
    setTotalPages(data.lastPage);
    return data;
  };
  const {
    data,
    error,
    isLoading,
  }: {
    data: ImageDataResponseProps;
    error: any;
    isLoading: boolean;
  } = useSWR(`/api/image?page=${currentPage}`, fetcher, {
    refreshInterval: 2000,
  });

  useEffect(() => {
    return () => {
      if (worker) {
        worker.terminate();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function imageClickHandler(image: ImageProps) {
    setActiveImage(image);
    const blob = await fetchImage(image.url); // Menggunakan thumbnail dengan resolusi lebih kecil
    if (blob) {
      try {
        console.time("OCR");
        const worker = await createWorker({
          logger: (m) => {
            console.log("OCR: ", m);
            setProgressOcr(m.progress);
          },
        });
        setWorker(worker);
        await worker.loadLanguage("eng");
        await worker.initialize("eng");
        const response = await worker.recognize(blob);
        const { data } = response;
        setImageText(data.text);
        console.timeEnd("OCR");
      } catch (error) {
        console.error("Error recognizing image text:", error);
      }
    }
  }

  async function fetchImage(imageUrl: string) {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch image");
      }
      const blob = await response.blob();
      setImageBlob(blob);
      return blob;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  function changePage(page: number) {
    setCurrentPage(page);
  }

  function getDisplayedPages() {
    const totalDisplayedPages = 5; // Jumlah tombol angka yang ingin ditampilkan
    const halfDisplayedPages = Math.floor(totalDisplayedPages / 2);
    let startPage = Math.max(currentPage - halfDisplayedPages, 1);
    let endPage = startPage + totalDisplayedPages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(endPage - totalDisplayedPages + 1, 1);
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, index) => startPage + index
    );
  }

  return (
    <div className="">
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setActiveImage(imageDefault);
            setImageBlob(null);
            setImageText("");
            if (worker) {
              worker.terminate();
            }
          }
        }}
      >
        <DialogContent className="max-w-[95vw] max-h-[42rem] overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 py-4">
            {imageBlob && (
              <Image
                src={URL.createObjectURL(imageBlob)}
                loader={() => {
                  return URL.createObjectURL(imageBlob);
                }}
                width={10000}
                height={10000}
                sizes="100vw"
                alt={activeImage.filename}
              />
            )}
            <Progress value={progressOcr * 100} className="w-full h-2" />
            <Textarea
              defaultValue={imageText}
              rows={25}
              className="max-h-[32rem]"
            />
            {/* <p dangerouslySetInnerHTML={{ __html: imageText }}></p> */}
          </div>
          <DialogFooter></DialogFooter>
        </DialogContent>
        <div className="grid grid-cols-4 gap-2 my-2">
          {data?.data &&
            data?.data.map((image: ImageProps) => {
              return (
                <div
                  className="relative aspect-video"
                  key={image.filename}
                  onClick={() => {
                    imageClickHandler(image);
                  }}
                >
                  <DialogTrigger asChild>
                    <Image
                      src={image.thumbnails[2]} // Menggunakan thumbnail dengan resolusi lebih kecil
                      alt={image.filename}
                      className="object-cover"
                      fill
                    />
                  </DialogTrigger>
                </div>
              );
            })}
        </div>
      </Dialog>
      <nav className="pagination">
        <ul className="inline-flex -space-x-px">
          {/* Tombol navigasi ke halaman sebelumnya */}
          <li>
            <button
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50"
            >
              Previous
            </button>
          </li>
          {/* Menampilkan nomor halaman */}
          {getDisplayedPages().map((pageNumber) => (
            <li key={pageNumber}>
              <button
                onClick={() => changePage(pageNumber)}
                className={`px-3 py-2 leading-tight ${
                  currentPage === pageNumber
                    ? "text-blue-600 bg-blue-50 active"
                    : "text-gray-500 bg-white"
                } border border-gray-300 hover:bg-gray-100 ${
                  currentPage === pageNumber
                    ? "hover:text-blue-700"
                    : "hover:text-gray-700"
                } dark:border-gray-700 ${
                  currentPage === pageNumber
                    ? "dark:bg-gray-700 dark:text-white"
                    : "dark:bg-gray-800 dark:text-gray-400"
                } dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50`}
              >
                {pageNumber}
              </button>
            </li>
          ))}
          {/* Tombol navigasi ke halaman berikutnya */}
          <li>
            <button
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50"
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
