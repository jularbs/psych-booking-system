import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith } from 'rxjs';
import { ServiceRecord } from '../../data-access/services-api.service';
import { ServicesApiService } from '../../data-access/services-api.service';

type ServicesManageState = {
  records: ServiceRecord[];
  isLoading: boolean;
  errorMessage: string | null;
};

@Component({
  selector: 'app-services-manage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './services-manage.component.html',
})
export class ServicesManageComponent {
  private readonly servicesApiService = inject(ServicesApiService);

  private readonly state = toSignal(
    this.servicesApiService.listManage().pipe(
      map(
        (records): ServicesManageState => ({
          records,
          isLoading: false,
          errorMessage: null,
        }),
      ),
      catchError(() =>
        of<ServicesManageState>({
          records: [],
          isLoading: false,
          errorMessage: 'Failed to load services.',
        }),
      ),
      startWith<ServicesManageState>({
        records: [],
        isLoading: true,
        errorMessage: null,
      }),
    ),
    {
      initialValue: {
        records: [],
        isLoading: true,
        errorMessage: null,
      },
    },
  );

  readonly services = computed(() => this.state().records);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly errorMessage = computed(() => this.state().errorMessage);
}
