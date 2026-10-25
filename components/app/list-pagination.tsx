import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";

type ListPaginationProps = {
  page: number;
  pageCount: number;
  /** Href for a given page number (keeps the list's other filters). */
  hrefForPage: (page: number) => string;
};

/** Previous / next pager for server-paginated lists (`?page=`). */
export function ListPagination({ page, pageCount, hrefForPage }: ListPaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          {page > 1 ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={hrefForPage(page - 1)}>
                <ChevronLeftIcon />
                Sebelumnya
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" disabled>
              <ChevronLeftIcon />
              Sebelumnya
            </Button>
          )}
        </PaginationItem>
        <PaginationItem>
          <span className="px-2 text-sm text-muted-foreground">
            Halaman {page} dari {pageCount}
          </span>
        </PaginationItem>
        <PaginationItem>
          {page < pageCount ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={hrefForPage(page + 1)}>
                Berikutnya
                <ChevronRightIcon />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" disabled>
              Berikutnya
              <ChevronRightIcon />
            </Button>
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

