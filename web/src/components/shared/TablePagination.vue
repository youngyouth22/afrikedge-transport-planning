<script setup lang="ts">
import { computed } from 'vue'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

const props = withDefaults(
  defineProps<{
    page: number
    limit: number
    total: number
    totalPages: number
    isLoading?: boolean
    pageSizeOptions?: number[]
  }>(),
  {
    isLoading: false,
    pageSizeOptions: () => [10, 20, 50],
  },
)

const emit = defineEmits<{
  (e: 'change-page', page: number): void
  (e: 'change-limit', limit: number): void
}>()

function goToPage(p: number) {
  if (p >= 1 && p <= props.totalPages && p !== props.page && !props.isLoading) {
    emit('change-page', p)
  }
}

type PageItem = number | 'ellipsis'

const displayedPages = computed<PageItem[]>(() => {
  const current = props.page
  const total = props.totalPages

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  if (current <= 3) {
    return [1, 2, 3, 4, 'ellipsis', total]
  }

  if (current >= total - 2) {
    return [1, 'ellipsis', total - 3, total - 2, total - 1, total]
  }

  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total]
})
</script>

<template>
  <div v-if="totalPages > 1" class="flex justify-end py-3">
    <Pagination class="justify-end w-auto mx-0">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            :disabled="page <= 1 || isLoading"
            @click="goToPage(page - 1)"
          />
        </PaginationItem>

        <template v-for="(item, index) in displayedPages" :key="index">
          <PaginationItem v-if="item !== 'ellipsis'">
            <PaginationLink
              :is-active="item === page"
              :disabled="isLoading"
              @click="goToPage(item)"
            >
              {{ item }}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem v-else>
            <PaginationEllipsis />
          </PaginationItem>
        </template>

        <PaginationItem>
          <PaginationNext
            :disabled="page >= totalPages || isLoading"
            @click="goToPage(page + 1)"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  </div>
</template>
