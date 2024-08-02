import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderButtonsComponent } from './header-buttons.component';
import { MockProviders } from 'ng-mocks';
import { SettingsService } from '../../../service/settings/settings.service';
import { TitleService } from '../../../../tool/header/service/title.service';
import { ModelerService } from '../../../../tool/modeler/service/modeler.service';
import { ReplayStateService } from '../../../../tool/replay/service/replay-state.service';
import { DirtyFlagService } from '../../../../domain/service/dirty-flag.service';
import { ElementRegistryService } from '../../../../domain/service/element-registry.service';
import { DialogService } from '../../../../domain/service/dialog.service';
import { ReplayService } from '../../../../tool/replay/service/replay.service';
import { ExportService } from '../../../../tool/export/service/export.service';
import { ImportDomainStoryService } from '../../../../tool/import/service/import-domain-story.service';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('HeaderButtonsComponent', () => {
  let component: HeaderButtonsComponent;
  let fixture: ComponentFixture<HeaderButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HeaderButtonsComponent],
      providers: [
        MockProviders(
          SettingsService,
          TitleService,
          ModelerService,
          ReplayStateService,
          DirtyFlagService,
          ElementRegistryService,
          DialogService,
          ReplayService,
          ExportService,
          ImportDomainStoryService,
          MatSnackBar,
        ),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
