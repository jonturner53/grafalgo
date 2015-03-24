SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../include
LDIR := ../lib
BIN := ~/bin
CXXFLAGS := -Wall ${ARCH} -O2 -std=c++0x

all:
	make -C misc    IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C mst    IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C sPath  IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C maxFlo IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C mcFlo  IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C match  IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C eColor IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C egColor IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all

clean:
	make -C misc   clean
	make -C mst    clean
	make -C sPath  clean
	make -C maxFlo clean
	make -C mcFlo  clean
	make -C match  clean
	make -C eColor  clean
	make -C egColor  clean
