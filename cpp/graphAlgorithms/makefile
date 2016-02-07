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
	make -C spath  IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C mflo IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C mcf  IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C match  IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C ecolor IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C egcolor IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C becolor IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all

clean:
	make -C misc   clean
	make -C mst    clean
	make -C spath  clean
	make -C mflo clean
	make -C mcf  clean
	make -C match  clean
	make -C ecolor  clean
	make -C egcolor  clean
	make -C becolor  clean
