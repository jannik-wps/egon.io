import {Component, OnInit} from '@angular/core';
import {SettingsService} from 'src/app/Service/Settings/settings.service';
import {BehaviorSubject, Observable} from 'rxjs';
import {DialogService} from './Service/Dialog/dialog.service';
import {MatDialogConfig} from '@angular/material/dialog';
import {InfoDialogData} from './Domain/Dialog/infoDialogData';
import {InfoDialogComponent} from './Presentation/Dialog/info-dialog/info-dialog.component';
import {TitleService} from "./Service/Title/title.service";
import {VERSION} from "./Domain/Common/constants";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  showSettingsSubscription: Observable<boolean> | BehaviorSubject<boolean>;
  showDescription: Observable<boolean>;
  version: string = '';

  constructor(
    private settingsService: SettingsService,
    private dialogService: DialogService,
    private titleService: TitleService
  ) {
    this.showSettingsSubscription = new BehaviorSubject(false);
    this.showDescription = new BehaviorSubject(true);
    this.version = VERSION
  }

  ngOnInit(): void {
    this.showDescription = this.titleService.getShowDescriptionObservable();
    this.showSettingsSubscription = this.settingsService.getShowSettings();
  }

  openLinkDialog(link: string, title: string, text: string): void {
    const config = new MatDialogConfig();
    config.disableClose = false;
    config.autoFocus = true;

    config.data = new InfoDialogData(title, text, true, true, link);

    this.dialogService.openDialog(InfoDialogComponent, config);
  }
}
